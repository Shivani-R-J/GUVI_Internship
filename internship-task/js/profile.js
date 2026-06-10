$(document).ready(function () {
  const token = localStorage.getItem("session_token");
  const email = localStorage.getItem("email");

  // Redirect if not logged in
  if (!token) {
    window.location.href = "login.html";
    return;
  }

  // --- Helpers ---
  function getInitials(email) {
    const name = email.split('@')[0];
    const parts = name.split(/[._-]/);
    return parts.length >= 2
      ? (parts[0][0] + parts[1][0]).toUpperCase()
      : name.substring(0, 2).toUpperCase();
  }

  function formatDate(dateStr) {
    if (!dateStr) return "—";
    const d = new Date(dateStr);
    return isNaN(d) ? dateStr : d.toLocaleDateString('en-IN', { day:'numeric', month:'long', year:'numeric' });
  }

  function showToast(msg, isError) {
    $("#toast")
      .text(msg)
      .css("background", isError ? "#dc2626" : "#095c32")
      .fadeIn(300)
      .delay(2500)
      .fadeOut(400);
  }

  function validate() {
    let ok = true;
    const age = $("#age").val();
    if (!age || age < 15 || age > 60) {
      $("#ageErr").show(); $("#age").addClass("is-invalid"); ok = false;
    } else {
      $("#ageErr").hide(); $("#age").removeClass("is-invalid");
    }
    if (!$("#dob").val()) {
      $("#dobErr").show(); $("#dob").addClass("is-invalid"); ok = false;
    } else {
      $("#dobErr").hide(); $("#dob").removeClass("is-invalid");
    }
    const contact = $("#contact").val().replace(/\D/g, '');
    if (contact.length < 10) {
      $("#contactErr").show(); $("#contact").addClass("is-invalid"); ok = false;
    } else {
      $("#contactErr").hide(); $("#contact").removeClass("is-invalid");
    }
    if (!$("#address").val().trim()) {
      $("#addressErr").show(); $("#address").addClass("is-invalid"); ok = false;
    } else {
      $("#addressErr").hide(); $("#address").removeClass("is-invalid");
    }
    return ok;
  }

  // --- Populate avatar ---
  $("#navEmail").text(email);
  $("#avatarCircle").text(getInitials(email));
  $("#avatarName").text(
    email.split('@')[0].replace(/[._-]/g, ' ')
      .replace(/\b\w/g, c => c.toUpperCase())
  );
  $("#avatarEmail").text(email);

  // --- Show view mode with data ---
  function showViewMode(data) {
    $("#viewAge").text(data.age || "—");
    $("#viewDob").text(formatDate(data.dob));
    $("#viewContact").text(data.contact || "—");
    $("#viewAddress").text(data.address || "—");
    $("#editCard").hide();
    $("#emptyCard").hide();
    $("#viewCard").show();
  }

  // --- Switch to edit mode, pre-fill inputs ---
  function showEditMode(data) {
    if (data) {
      $("#age").val(data.age);
      $("#dob").val(data.dob);
      $("#contact").val(data.contact);
      $("#address").val(data.address);
    }
    $("#viewCard").hide();
    $("#emptyCard").hide();
    $("#editCard").show();
  }

  // --- Load profile on page load ---
  let savedData = null;

  $.ajax({
    url: "php/profile.php",
    type: "GET",
    data: { token: token, email: email },
    success: function (response) {
      const res = typeof response === "string" ? JSON.parse(response) : response;

      if (res.status === "error") {
        // Session expired
        localStorage.removeItem("session_token");
        localStorage.removeItem("email");
        window.location.href = "login.html";
        return;
      }

      const d = res.data;
      const hasData = d.age || d.dob || d.contact || d.address;

      if (hasData) {
        savedData = d;
        showViewMode(d);         // returning user → view mode
      } else {
        $("#emptyCard").show();  // first time user → empty state
      }
    },
    error: function () {
      showToast("Could not load profile. Please try again.", true);
    }
  });

  // Edit button → switch to edit mode
  $("#editBtn").click(function () {
    showEditMode(savedData);
  });

  // "Fill Profile Now" button on empty state
  $("#startFillBtn").click(function () {
    showEditMode(null);
  });

  // Cancel → go back to view mode (only if data exists)
  $("#cancelBtn").click(function () {
    if (savedData) {
      showViewMode(savedData);
    } else {
      $("#editCard").hide();
      $("#emptyCard").show();
    }
  });

  // Save changes
  $("#updateBtn").click(function () {
    if (!validate()) return;

    $("#updateBtn").text("Saving...").prop("disabled", true);

    $.ajax({
      url: "php/profile.php",
      type: "POST",
      contentType: "application/json",
      data: JSON.stringify({
        token: token,
        email: email,
        age: $("#age").val(),
        dob: $("#dob").val(),
        contact: $("#contact").val(),
        address: $("#address").val()
      }),
      success: function (response) {
        const res = typeof response === "string" ? JSON.parse(response) : response;
        $("#updateBtn").text("Save Changes").prop("disabled", false);

        if (res.status === "success") {
          // Update savedData and switch to view mode
          savedData = {
            age: $("#age").val(),
            dob: $("#dob").val(),
            contact: $("#contact").val(),
            address: $("#address").val()
          };
          const now = new Date();
          $("#lastSaved").text("Last saved at " + now.toLocaleTimeString([], { hour:'2-digit', minute:'2-digit' }));
          showToast("✓ Profile saved successfully!");
          showViewMode(savedData);
        } else {
          showToast(res.message, true);
        }
      },
      error: function () {
        $("#updateBtn").text("Save Changes").prop("disabled", false);
        showToast("Server error. Please try again.", true);
      }
    });
  });

  // Logout
  $("#logoutBtn").click(function () {
    localStorage.removeItem("session_token");
    localStorage.removeItem("email");
    window.location.href = "login.html";
  });
});
