import LoginForm from './LoginForm';

export default function EmployeeLogin({ onLoggedIn }: { onLoggedIn?: () => void }) {
  return <LoginForm role="employee" onSuccess={onLoggedIn} />;
}
