import { useState } from 'react';
import { Navigate, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext.jsx';
import { useSettings } from '../../context/SettingsContext.jsx';
import { useSeo } from '../../lib/seo.js';
import { Button } from '../../components/ui/Button.jsx';
import { Field, Input } from '../../components/ui/Form.jsx';
import { Notice } from '../../components/ui/Feedback.jsx';
import { Icon } from '../../components/ui/Icons.jsx';

export default function AdminLogin() {
  const { user, loading, login } = useAuth();
  const { brand } = useSettings();
  const navigate = useNavigate();
  const location = useLocation();
  const [form, setForm] = useState({ username: '', password: '' });
  const [state, setState] = useState({ busy: false, error: null });

  useSeo({ title: 'ورود مدیر | کناف کرج', description: 'ورود به پنل مدیریت سایت کناف کرج.' });

  if (!loading && user?.role === 'admin') {
    return <Navigate to={location.state?.from ?? '/admin'} replace />;
  }

  const submit = async (event) => {
    event.preventDefault();
    setState({ busy: true, error: null });
    try {
      await login(form.username, form.password);
      navigate('/admin', { replace: true });
    } catch (error) {
      setState({ busy: false, error: error.message });
    }
  };

  return (
    <div className="login-screen">
      <div className="login-card">
        <div className="login-card__brand">
          <img src={brand.logo || '/images/brand/logo.svg'} alt={`لوگوی ${brand.name_fa}`} />
          <div>
            <h1 style={{ fontSize: 'var(--fs-lg)', margin: 0 }}>پنل مدیریت {brand.name_fa}</h1>
            <span className="muted small">برای ادامه، اطلاعات حساب مدیر را وارد کنید.</span>
          </div>
        </div>

        <form className="form" onSubmit={submit}>
          {state.error ? <Notice variant="error">{state.error}</Notice> : null}
          <Field label="نام کاربری" htmlFor="login-username" required>
            <Input
              id="login-username"
              value={form.username}
              onChange={(event) => setForm({ ...form, username: event.target.value })}
              autoComplete="username"
              required
            />
          </Field>
          <Field label="رمز عبور" htmlFor="login-password" required>
            <Input
              id="login-password"
              type="password"
              value={form.password}
              onChange={(event) => setForm({ ...form, password: event.target.value })}
              autoComplete="current-password"
              required
            />
          </Field>
          <Button type="submit" variant="primary" block busy={state.busy}>
            <Icon name="shield" size={18} />
            ورود به پنل مدیریت
          </Button>
          <span className="form__note">
            دسترسی به این بخش فقط برای حساب مدیر مجاز است و همه عملیات مدیریتی در سرور کنترل می‌شود.
          </span>
        </form>
      </div>
    </div>
  );
}
