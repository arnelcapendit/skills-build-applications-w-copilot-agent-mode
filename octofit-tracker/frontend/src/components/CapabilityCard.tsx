import type { ReactNode } from 'react';

type Props = {
  title: string;
  description: string;
  isLoading?: boolean;
  error?: string | null;
  empty?: boolean;
  emptyMessage?: string;
  children?: ReactNode;
};

export function CapabilityCard({
  title,
  description,
  isLoading = false,
  error = null,
  empty = false,
  emptyMessage = 'No data available.',
  children,
}: Props) {
  return (
    <section className="card h-100">
      <div className="card-body">
        <h2 className="h4">{title}</h2>
        <p>{description}</p>
        {isLoading && <p role="status">Loading...</p>}
        {!isLoading && error && <p role="alert">Unable to load {title.toLowerCase()}: {error}</p>}
        {!isLoading && !error && empty && <p>No {emptyMessage}</p>}
        {!isLoading && !error && !empty && children}
      </div>
    </section>
  );
}
