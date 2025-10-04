import { loginEmailPassword, registerEmailPassword, loginWithGoogle, onAuth, logout } from "./auth";

const $authView = document.getElementById("auth-view")!;
const $appView = document.getElementById("app-view")!;
const $email = document.getElementById("email") as HTMLInputElement;
const $password = document.getElementById("password") as HTMLInputElement;
const $loginBtn = document.getElementById("login-btn") as HTMLButtonElement;
const $registerBtn = document.getElementById("register-btn") as HTMLButtonElement;
const $googleBtn = document.getElementById("google-btn") as HTMLButtonElement;
const $logoutBtn = document.getElementById("logout-btn") as HTMLButtonElement;
const $authError = document.getElementById("auth-error")!;
const $userEmail = document.getElementById("user-email")!;
const $userUid = document.getElementById("user-uid")!;

function showAuth() {
  $authView.classList.remove("hidden");
  $appView.classList.add("hidden");
}

function showApp(email: string, uid: string) {
  ($userEmail as HTMLElement).textContent = email;
  ($userUid as HTMLElement).textContent = `UID: ${uid}`;
  $appView.classList.remove("hidden");
  $authView.classList.add("hidden");
}

function setError(msg: string) {
  $authError.textContent = msg;
}

$loginBtn.onclick = async () => {
  setError("");
  try {
    const email = $email.value.trim();
    const pass = $password.value;
    if (!email || !pass) return setError("Escribe tu correo y contraseña.");
    await loginEmailPassword(email, pass);
  } catch (e: any) {
    setError(parseFirebaseError(e?.code) || "No se pudo iniciar sesión.");
  }
};

$registerBtn.onclick = async () => {
  setError("");
  try {
    const email = $email.value.trim();
    const pass = $password.value;
    if (!email || !pass) return setError("Escribe correo y contraseña.");
    if (pass.length < 6) return setError("La contraseña debe tener al menos 6 caracteres.");
    await registerEmailPassword(email, pass);
  } catch (e: any) {
    setError(parseFirebaseError(e?.code) || "No se pudo crear la cuenta.");
  }
};

$googleBtn.onclick = async () => {
  setError("");
  try {
    await loginWithGoogle();
  } catch (e: any) {
    setError(parseFirebaseError(e?.code) || "No se pudo continuar con Google.");
  }
};

$logoutBtn.onclick = async () => {
  await logout();
};

onAuth((user) => {
  if (user) {
    showApp(user.email ?? "Usuario", user.uid);
  } else {
    showAuth();
  }
});

function parseFirebaseError(code?: string): string | undefined {
  switch (code) {
    case "auth/invalid-email": return "Correo inválido.";
    case "auth/user-not-found": return "Usuario no encontrado.";
    case "auth/wrong-password": return "Contraseña incorrecta.";
    case "auth/email-already-in-use": return "Ese correo ya está registrado.";
    case "auth/popup-closed-by-user": return "Se cerró la ventana de Google.";
    case "auth/popup-blocked": return "El navegador bloqueó el popup.";
    default: return undefined;
  }
}
