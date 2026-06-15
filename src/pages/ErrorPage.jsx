import { useRouteError } from 'react-router-dom';

export default function ErrorPage() {
  const error = useRouteError();

  return (
    <div style={{
      padding: '2rem',
      textAlign: 'center',
      minHeight: '80vh',
      display: 'flex',
      flexDirection: 'column',
      justifyContent: 'center',
      alignItems: 'center',
    }}>
      <h1>Oops!</h1>
      <p>Sorry, an unexpected error has occurred.</p>
      {error?.status === 404 && <p>Page not found</p>}
      {error?.statusText && <p>{error.statusText}</p>}
      {error?.message && <p>{error.message}</p>}
    </div>
  );
}
