$(document).ready(function () {
  $("#registerBtn").click(function () {
    const username = $("#username").val().trim();
    const email = $("#email").val().trim();
    const password = $("#password").val().trim();

    if (!username || !email || !password) {
      alert("All fields are required!");
      return;
    }

    $.ajax({
      url: "php/register.php",
      type: "POST",
      contentType: "application/json",
      data: JSON.stringify({ username, email, password }),
      success: function (response) {
        const res = typeof response === "string" ? JSON.parse(response) : response;
        if (res.status === "success") {
          alert("Registration successful!");
          window.location.href = "login.html";
        } else {
          alert("Error: " + res.message);
        }
      },
      error: function () {
        alert("Server error. Try again.");
      }
    });
  });
});
