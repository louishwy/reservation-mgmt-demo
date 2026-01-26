import LoginForm from './LoginForm';

export default function GuestLogin({ onLoggedIn }: { onLoggedIn?: () => void }) {
  return <LoginForm role="guest" onSuccess={onLoggedIn} />;
}
