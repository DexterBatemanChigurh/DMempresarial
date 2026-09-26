export default function DevLayout({ children }: { children: React.ReactNode }) {
  return (
    <main id="conteudo" tabIndex={-1} className="outline-none">
      {children}
    </main>
  );
}
