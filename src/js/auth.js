import { sb } from "./config.js";
import { setState, selectedRole } from "./state.js";
import { showToast, showScreen, showAuthError, hideAuthError } from "./utils.js";
import { onAuthenticated } from "./session.js";

/* ============================================================
   AUTH
   ============================================================ */

export function switchAuthTab(tab) {
  document
    .getElementById("tab-login")
    ?.classList.toggle("active", tab === "login");

  document
    .getElementById("tab-register")
    ?.classList.toggle("active", tab === "register");

  document.getElementById("login-form").style.display =
    tab === "login" ? "block" : "none";

  document.getElementById("register-form").style.display =
    tab === "register" ? "block" : "none";

  hideAuthError();
}


export function setRole(role) {
  selectedRole = role;

  document
    .getElementById("role-passenger")
    ?.classList.toggle("active", role === "passenger");

  document
    .getElementById("role-driver")
    ?.classList.toggle("active", role === "driver");
}


/* ---------------- LOGIN ---------------- */

export async function handleLogin(event) {
  event.preventDefault();

  hideAuthError();

  const button = document.getElementById("login-btn");

  button.disabled = true;
  button.textContent = "Logging in…";

  const email =
    document.getElementById("login-email").value.trim();

  const password =
    document.getElementById("login-password").value;

  try {
    const { data, error } =
      await sb.auth.signInWithPassword({
        email,
        password
      });

    if (error) {
      console.error("Login error:", error);

      showAuthError(
        error.message === "Invalid login credentials"
          ? "Incorrect email or password. Try again."
          : error.message
      );

      return;
    }

    if (!data?.user) {
      showAuthError("Login succeeded but no user was returned.");
      return;
    }

    await onAuthenticated(data.user);

  } catch (error) {
    console.error("Unexpected login error:", error);
    showAuthError("Something went wrong while logging in.");
  } finally {
    button.disabled = false;
    button.textContent = "Log in";
  }
}


/* ---------------- REGISTER ---------------- */

export async function handleRegister(event) {
  event.preventDefault();

  hideAuthError();

  const button = document.getElementById("register-btn");

  button.disabled = true;
  button.textContent = "Creating account…";

  const name =
    document.getElementById("reg-name").value.trim();

  const studentNo =
    document.getElementById("reg-studentno").value.trim();

  const program =
    document.getElementById("reg-program").value.trim();

  const email =
    document.getElementById("reg-email").value.trim();

  const password =
    document.getElementById("reg-password").value;

  try {

    /* Create authentication account */

    const { data, error } =
      await sb.auth.signUp({
        email,
        password,

        options: {
          data: {
            full_name: name
          }
        }
      });

    if (error) {
      console.error("Registration error:", error);
      showAuthError(error.message);
      return;
    }

    if (!data?.user) {
      showAuthError("Account could not be created.");
      return;
    }


    /*
      IMPORTANT:

      This code assumes your database has a trigger that
      automatically creates a profiles row.

      If you DO NOT have that trigger, see the SQL section
      below this code.
    */


    /*
      If the user is immediately authenticated,
      update the profile.
    */

    if (data.session) {

      const { error: profileError } =
        await sb
          .from("profiles")
          .update({
            full_name: name,
            student_no: studentNo || null,
            program: program || null,
            role: selectedRole
          })
          .eq("id", data.user.id);

      if (profileError) {
        console.error(
          "Profile update error:",
          profileError
        );

        showAuthError(
          "Account created, but your profile could not be saved."
        );

        return;
      }

      await onAuthenticated(data.user);

    } else {

      showToast(
        "Account created. Check your email to confirm your account."
      );

      switchAuthTab("login");
    }

  } catch (error) {

    console.error(
      "Unexpected registration error:",
      error
    );

    showAuthError(
      "Something went wrong while creating the account."
    );

  } finally {

    button.disabled = false;
    button.textContent = "Create account";
  }
}


/* ---------------- PASSWORD RESET ---------------- */

export async function handleForgotPassword() {

  hideAuthError();

  const email =
    document.getElementById("login-email").value.trim();

  if (!email) {
    showAuthError(
      "Enter your email first, then tap Forgot password."
    );

    return;
  }

  const link =
    document.querySelector(".forgot-link");

  const previousText = link.textContent;

  link.textContent = "Sending…";

  try {

    const { error } =
      await sb.auth.resetPasswordForEmail(
        email,
        {
          redirectTo: window.location.href
        }
      );

    if (error) {
      console.error(
        "Password reset error:",
        error
      );

      showAuthError(error.message);
      return;
    }

    showToast(
      `Password reset link sent to ${email}`
    );

  } finally {

    link.textContent = previousText;
  }
}
