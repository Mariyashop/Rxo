document.addEventListener("DOMContentLoaded", () => {
  const form = document.querySelector("form");

  form.addEventListener("submit", async (e) => {
    e.preventDefault(); // جلوگیری از رفتار پیش‌فرض فرم

    const username = document.getElementById("username").value.trim();
    const password = document.getElementById("password").value;
    const confirmPassword = document.getElementById("confirm-password").value;

    if (password !== confirmPassword) {
      alert("رمز عبور و تایید آن یکسان نیستند.");
      return;
    }

    const userData = {
      username,
      password,
    };

    try {
      const response = await fetch("http://localhost:5007/users", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(userData),
      });

      if (response.ok) {
        alert("ثبت‌نام با موفقیت انجام شد!");
        form.reset(); // پاک‌سازی فرم
      } else {
        alert("خطا در ثبت‌نام. لطفاً دوباره تلاش کنید.");
      }
    } catch (error) {
      console.error("خطا:", error);
      alert("ارتباط با سرور برقرار نشد.");
    }
  });
});
