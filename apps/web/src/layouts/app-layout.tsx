type Props = {
  children: React.ReactNode;
};

export function AppLayout({ children }: Props) {
  return (
    <main className="min-h-screen bg-slate-50">
      <div className="mx-auto max-w-7xl p-6">
        {children}
      </div>
    </main>
  );
}