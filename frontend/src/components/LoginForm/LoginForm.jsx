import { useState } from "react";
import { LockKeyhole, LogIn, User } from "lucide-react";
import "./LoginForm.css";

function LoginForm({ onLogin }) {
  const [login, setLogin] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");

  function handleSubmit(event) {
    event.preventDefault();

    if (!onLogin(login, password)) {
      setError("Неправильний логін або пароль");
      return;
    }

    setError("");
  }

  return (
    <section className="login-card" aria-labelledby="login-title">
      <div className="login-icon" aria-hidden="true">
        <LockKeyhole />
      </div>

      <div className="login-heading">
        <p>Telegram</p>
        <h1 id="login-title">Вхід до системи</h1>
        <span>Увійдіть, щоб переглянути подані заявки</span>
      </div>

      <form className="login-form" onSubmit={handleSubmit}>
        <label className="login-field">
          <span>Логін</span>
          <div className="login-input-wrap">
            <User aria-hidden="true" />
            <input
              type="text"
              value={login}
              onChange={(event) => setLogin(event.target.value)}
              autoComplete="username"
              placeholder="Введіть логін"
              required
              autoFocus
            />
          </div>
        </label>

        <label className="login-field">
          <span>Пароль</span>
          <div className="login-input-wrap">
            <LockKeyhole aria-hidden="true" />
            <input
              type="password"
              value={password}
              onChange={(event) => setPassword(event.target.value)}
              autoComplete="current-password"
              placeholder="Введіть пароль"
              required
            />
          </div>
        </label>

        {error && (
          <p className="login-error" role="alert">
            {error}
          </p>
        )}

        <button className="login-submit" type="submit">
          <LogIn aria-hidden="true" />
          Увійти
        </button>
      </form>
    </section>
  );
}

export default LoginForm;
