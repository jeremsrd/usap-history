export default function Footer({ mention }: { mention: string }) {
  return (
    <footer className="border-t border-border bg-usap-fond">
      <div className="mx-auto max-w-7xl px-4 py-6 text-center text-sm text-muted-foreground">
        {mention}
      </div>
    </footer>
  );
}
