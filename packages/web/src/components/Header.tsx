'use client';

interface HeaderProps {
  currentPage?: 'home' | 'history' | 'manual';
}

export default function Header({ currentPage = 'home' }: HeaderProps) {
  const linkStyle = (page: string) => ({
    color: currentPage === page ? '#e5e5e5' : '#525252',
    fontSize: 13,
    textDecoration: 'none' as const,
    fontWeight: currentPage === page ? 600 : 400,
    padding: '4px 8px',
    borderRadius: 4,
    background: currentPage === page ? '#1e1e1e' : 'transparent',
  });

  return (
    <header style={{
      borderBottom: '1px solid #262626',
      padding: '16px 24px',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'space-between',
    }}>
      <h1 style={{ margin: 0, fontSize: 20, fontWeight: 600, letterSpacing: '-0.02em' }}>
        <a href="/" style={{ textDecoration: 'none' }}>
          <span style={{ color: '#737373' }}>ARO</span>
        </a>{' '}
        <span style={{ color: '#525252', fontWeight: 400, fontSize: 14 }}>Automated Research Orchestrator</span>
      </h1>
      <nav style={{ display: 'flex', gap: 4 }}>
        <a href="/" style={linkStyle('home')}>Home</a>
        <a href="/history" style={linkStyle('history')}>History</a>
        <a href="/manual" style={linkStyle('manual')}>Manual</a>
      </nav>
    </header>
  );
}
