$(document).ready(function () {
  $("#loginBtn").click(function () {
    const email = $("#email").val().trim();
    const password = $("#password").val().trim();

    if (!email || !password) {
      alert("All fields are required!");
      return;
    }

    $.ajax({
      url: "php/login.php",
      type: "POST",
      contentType: "application/json",
      data: JSON.stringify({ email, password }),
      success: function (response) {
        const res = typeof response === "string" ? JSON.parse(response) : response;
        if (res.status === "success") {
          // Store session token in localStorage
          localStorage.setItem("session_token", res.token);
          localStorage.setItem("email", res.email);
          window.location.href = "profile.html";
        } else {
          alert("Login failed: " + res.message);
        }
      }
    });
  });
});
