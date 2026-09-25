# DM Empresarial — Security Runbook

Versão 1 · 25/09/2026

---

## 1. Visão Geral

Este documento descreve procedimentos de segurança operacional, resposta a incidentes e hardening contínuo. Baseado em `docs/03-engineering-architecture-blueprint.md` (seções 13, 14, 41).

---

## 2. Hardening Checklist (Contínuo)

| Área             | Ação                                         | Frequência             | Responsável     |
| ---------------- | -------------------------------------------- | ---------------------- | --------------- |
| Dependências     | `npm audit --audit-level=high`               | Semanal (CI)           | CI/CD           |
| Dependências     | `npm outdated`                               | Mensal                 | Tech Lead       |
| Segredos         | Gitleaks scan                                | Todo PR (CI)           | CI/CD           |
| Código           | Code review (security-focused)               | Todo PR                | Team            |
| Logs             | Revisão de `audit_logs` suspeitos            | Semanal                | Security        |
| Rate limits      | Ajuste de thresholds                         | Mensal                 | Tech Lead       |
| CSP              | Revisão de violações (report-only → enforce) | Trimestral             | Security        |
| Penetration test | Teste de intrusão completo                   | Pré-lançamento + anual | Externo/Interno |

---

## 3. Resposta a Incidentes

### 3.1 Classificação de Severidade

| Nível       | Critério                                              | SLA Resposta | SLA Resolução  |
| ----------- | ----------------------------------------------------- | ------------ | -------------- |
| **Crítico** | Vazamento de dados pessoais, RCE, auth bypass         | 1 hora       | 4 horas        |
| **Alto**    | IDOR confirmado, XSS armazenado, credenciais expostas | 4 horas      | 24 horas       |
| **Médio**   | Rate limit bypass, CSP violation, info disclosure     | 24 horas     | 72 horas       |
| **Baixo**   | Configuração subótima, log noise                      | 1 semana     | Próxima sprint |

### 3.2 Playbooks por Tipo

#### Vazamento de Credencial/Segredo

1. **Imediato**: Rotacionar segredo (ver seção 8 do DEPLOYMENT.md).
2. **Investigar**: `audit_logs` + logs de acesso → escopo do vazamento.
3. **Notificar**: Se dados pessoais expostos → LGPD (72h) + usuários afetados.
4. **Corrigir**: Identificar causa raiz (commit acidental, CI log, etc.).
5. **Documentar**: Incidente + ação corretiva + prevenção.

#### IDOR / BOLA Confirmado

1. **Imediato**: Desabilitar rota afetada (feature flag ou deploy hotfix).
2. **Investigar**: `audit_logs` → quais IDs acessados, por quem, quando.
3. **Corrigir**: Adicionar `assertCan` + teste negativo no `idor-sweep.test.ts`.
4. **Revisar**: Varredura completa em rotas similares.

#### XSS / Injeção de Conteúdo

1. **Imediato**: CSP `report-only` → identificar vetor.
2. **Investigar**: Qual input, qual rota, como bypassou validação.
3. **Corrigir**: Fortalecer allowlist (Tiptap, Zod, signed tokens).
4. **Testar**: Adicionar caso ao `tests/no-raw-html.test.ts` e `newsletter.test.ts`.

#### Rate Limit Bypass / Abuso

1. **Imediato**: Aumentar limite temporariamente / bloquear IP/usuario ofensivo.
2. **Investigar**: Padrão de ataque (credential stuffing, enumeração, spam).
3. **Corrigir**: Ajustar `RATE_LIMITS` + adicionar honeypot/captcha se necessário.
4. **Monitorar**: Dashboard de `rate_limits` table.

---

## 4. Auditoria Contínua

### 4.1 `audit_logs` - O que Monitorar

```sql
-- Tentativas de login falhas repetidas (últimas 24h)
SELECT actor_user_id, count(*) as tentativas, max(at) as ultima
FROM audit_logs
WHERE action = 'auth.login_failed' AND at > now() - interval '24 hours'
GROUP BY actor_user_id HAVING count(*) > 5;

-- Ações admin por usuário não-admin
SELECT * FROM audit_logs
WHERE actor_user_id IN (SELECT id FROM users WHERE role != 'ADMIN')
  AND action LIKE 'admin.%'
  AND at > now() - interval '7 days';

-- Acessos a dados sensíveis
SELECT * FROM audit_logs
WHERE entity_type IN ('lead', 'newsletter_subscriber', 'user')
  AND at > now() - interval '24 hours';
```

### 4.2 Alertas Automáticos (Implementar)

| Evento                       | Condição                             | Ação                         |
| ---------------------------- | ------------------------------------ | ---------------------------- |
| Login falho repetido         | > 5/15min por conta ou IP            | Bloqueio temporário + alerta |
| Acesso admin fora de horário | 22h-6h                               | Alerta Slack/e-mail          |
| Exportação de leads          | Qualquer `lead.export`               | Alerta imediato              |
| Falha de e-mail em massa     | > 10 leads com `notified_at IS NULL` | Alerta + retry manual        |
| Job cron parado              | Não roda 2x intervalo esperado       | Alerta + investigação        |

---

## 5. LGPD / Privacidade

| Direito do Titular | Implementação                                                          | Responsável       |
| ------------------ | ---------------------------------------------------------------------- | ----------------- |
| Acesso             | Admin → visualizar lead/assinante                                      | Admin             |
| Retificação        | Admin → editar lead/assinante                                          | Admin             |
| Eliminação         | Admin → `lead.delete` / `subscriber.delete` (anonymiza)                | Admin             |
| Portabilidade      | Exportação JSON/CSV (admin)                                            | Admin             |
| Oposição           | Descadastro newsletter (token) / lead `DISCARDED`                      | Usuário/Admin     |
| Retenção           | `ip_hash` ≤ 30 dias; `leads` ≤ prazo jurídico; `audit_logs` ≤ 12 meses | Job cron + config |

**Base legal**: Consentimento (newsletter, lead), Legítimo interesse (analytics anônimo), Obrigação legal (auditoria).

---

## 6. Testes de Segurança Automatizados

```bash
# Unitários (sempre)
npm test

# Integração (IDOR sweep, auth, rate limit, XSS)
npm run test:integration

# E2E + Acessibilidade
npm run test:e2e

# Lighthouse CI (performance + a11y + best-practices + SEO)
npm run lighthouse

# Auditoria de dependências
npm audit --audit-level=high

# Segredos no código/histórico
npx gitleaks detect --source=. --verbose

# Dependency review (PRs)
# Roda automaticamente no GitHub Actions
```

---

## 7. Configuração de Headers (Verificar em Production)

```bash
curl -I https://dm.empresarial.com/
# Esperado:
# Content-Security-Policy: default-src 'self'; script-src 'self' 'unsafe-inline'; ...
# Strict-Transport-Security: max-age=31536000; includeSubDomains
# X-Content-Type-Options: nosniff
# Referrer-Policy: strict-origin-when-cross-origin
# Permissions-Policy: camera=(), microphone=(), geolocation=()
# X-Frame-Options: DENY
# Cross-Origin-Opener-Policy: same-origin

curl -I https://dm.empresarial.com/admin/
# Esperado: CSP com nonce, sem 'unsafe-inline' em script-src
```

---

## 8. Checklist de Hardening Pré-Lançamento

- [ ] CSP em `report-only` por 2 semanas em staging → 0 violações → `enforce`
- [ ] HSTS `max-age=31536000; includeSubDomains` (preload após validação)
- [ ] `X-Frame-Options: DENY`, `X-Content-Type-Options: nosniff`
- [ ] `Referrer-Policy: strict-origin-when-cross-origin`
- [ ] `Permissions-Policy` restritiva
- [ ] `Cross-Origin-Opener-Policy: same-origin`
- [ ] Cookies: `HttpOnly`, `Secure`, `SameSite=Lax`
- [ ] Rate limits ativos em todas as rotas mutáveis
- [ ] `audit_logs` append-only (role `dm_app` sem UPDATE/DELETE)
- [ ] `SIGNED_TOKEN_SECRET` rotacionado, tokens antigos invalidados
- [ ] Gitleaks + Dependency review no CI
- [ ] Penetration test executado e achados corrigidos
- [ ] Backup/restore testado e documentado
- [ ] Rollback ensaiado (código + dados)

---

## 9. Referências

- `docs/03-engineering-architecture-blueprint.md` (seções 13, 14, 41, 42)
- `docs/04-project-audit-and-plan.md` (seção 12)
- `docs/DEPLOYMENT.md` (seções 4, 5, 6)
- OWASP Top 10 2025 / OWASP API Security Top 10 2023
- LGPD (Lei 13.709/2018)
