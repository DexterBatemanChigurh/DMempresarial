// Login e verificação do 2FA ficam fora da moldura do painel: o <main> é daqui.
export default function LoginLayout({ children }: { children: React.ReactNode }) {
  return (
    <main id="conteudo" tabIndex={-1} className="outline-none">
      {children}
    </main>
  );
}
