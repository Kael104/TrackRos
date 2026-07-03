interface PageContainerProps {
  children: React.ReactNode;
}

export function PageContainer({ children }: PageContainerProps) {
  return (
    <div className="mx-auto w-full max-w-6xl px-6 py-12 lg:px-8 lg:py-16">
      {children}
    </div>
  );
}
