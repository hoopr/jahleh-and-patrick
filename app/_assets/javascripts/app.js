/* =========================================================================
   Variables
   ========================================================================= */
const $window = $(window);
const $document = $(document);
const $htmlBody = $("html, body");
const $content = $(".content");
const firebaseRef = new Firebase("https://jahlehandpatrick.firebaseio.com");

/* Variables | RSVP
   ========================================================================= */
const $rsvpFormPart1 = $("#rsvp-form-part-1");
const $rsvpCodeField = $("#rsvp-form-part-1-code");
const $rsvpCodeNotFoundErr = $(".rsvp-form-part-1-code-not-found-error label");
const $rsvpFormPart2 = $("#rsvp-form-part-2");
const $rsvpFormConfirmation = $(".rsvp-form-confirmation");
const firebaseRsvpCodesRef = firebaseRef.child("rsvp/codes");
const firebaseRsvpGuestsRef = firebaseRef.child("rsvp/guests");

/* Variables | Guestbook
   ========================================================================= */
const $guestbookNameField = $("#guestbook-form-name");
const $guestbookNoteField = $("#guestbook-form-note");
const firebaseGuestbookRef = firebaseRef.child("guestbook");

/* =========================================================================
   Functions
   ========================================================================= */

/* Functions | RSVP
   ========================================================================= */

/**
 * Function that logs out a user from a past session and then logs in a user
 * anonymously when they have successfully entered an RSVP code.
 * @returns { Promise } Successful or failed Firebase anonymous login attempt
 */
function rsvpAnonymousLogin() {

  /* Clear any past sessions */
  firebaseRef.unauth();

  /* Log a user in anonymously and if error then reject, otherwise resolve */
  return new Promise((resolve, reject) => {
    firebaseRef.authAnonymously((error) => {
      if (error) {
        reject(error);
      }
      resolve();
    }, {
      /* Don't save the login state */
      remember: "none"
    });
  });
}

/**
 * Function that builds the HTML necessary to display a checkbox input based
 * on the guest information provided.
 * @param { Number } guestCount - Which guest number this is
 * @param { String } guestName - The full name of this guest
 * @param { String } guestAttending - "checked" or "" depending on guest RSVP
 * @returns { String } HTML for input customized for a specific guest
 */
function addGuestCheckbox(guestCount, guestName, guestAttending) {
  const checkbox = `
    <input type="checkbox"
      name="rsvp-form-part-2-guest-${guestCount}"
      id="rsvp-form-part-2-guest-${guestCount}"
      value="${guestName}"
      ${guestAttending}
    />
    <span>${guestName}</span>
    <br />
  `;

  return checkbox;
}

/**
 * Function that loads a guest's RSVP data.
 * @param { String } firebaseRSVPGuestKey - guest's key in Firebase data
 * @returns { Void } Returns no value
 */
function rsvpLoadGuestData(firebaseRsvpGuestKey) {

  /* Get Promise of RSVP login and when it resolves, do stuff */
  rsvpAnonymousLogin()
    .then(() => {
      let guestCount = 1; // Count number of guest checkboxes

      /* Query Firebase RSVP guests based on the provided key */
      firebaseRsvpGuestsRef.child(firebaseRsvpGuestKey).orderByKey().on("child_added", (guest) => {

        /* Find the submit button and add HTML for a new input before it */
        $rsvpFormPart2.find(".btn").before(addGuestCheckbox(guestCount, guest.val().name, guest.val().attending ? "checked" : ""));

        guestCount++;
      });
    })
    .catch(() => {}); // If Promise rejects, catch error
}

/* Functions | Guestbook
   ========================================================================= */

/**
 * Callback function that validates the Google reCAPTCHA when it's complete by
 * manually removing the reCAPTCHA error when user completes it.
 * @returns { Void } Returns no value
 */
function updateReCaptchaValidation() {
  $("#guestbook-form-g-recaptcha").removeClass("error").addClass("valid");
  $(".guestbook-form-g-recaptcha-error label").hide();
}

/**
 * Function that creates the HTML for a guestbook message and appends it to
 * the messages container.
 * @param { String } name - The full name submitted by person signing the form
 * @param { String } note - Message submitted by person signing the form
 * @returns { Void } Returns no value
 */
function addGuestbookMessage(name, note) {
  const message = `
    <hr>
    <section class="guestbook-message">
      <p class="guestbook-message-name">${name}:</p>
      <p class="guestbook-message-note">${note}</p>
    </section>
  `;

  $(".guestbook-messages").append(message);
}

/* =========================================================================
   jQuery Validate Validators
   ========================================================================= */

/* jQuery Validate Validators | RSVP
   ========================================================================= */
if ($content.hasClass("rsvp-content")) {

  /* Initialize validator for the RSVP code form */
  $("#rsvp-form-part-1").validate({

    /* Validation rules for each form field */
    rules: {
      "rsvp-form-part-1-code": {
        required: true
      }
    },

    /* Custom error messages for each form field */
    messages: {
      "rsvp-form-part-1-code": {
        required: "please enter a code."
      }
    },

    /**
     * When the RSVP code form is submitted and valid, queries the RSVP codes
     * in Firebase to see if code exists. If it does, shows the next form,
     * otherwise shows an error.
     * @return { Void } Returns no value
     */
    submitHandler() {

      /* Query the Firebase RSVP codes */
      firebaseRsvpCodesRef.once("value", (codes) => {

        /* Get a Firebase ref to the submitted code and then its value */
        const firebaseRsvpCodeRef = codes.child(sha512($rsvpCodeField.val()));
        const firebaseRsvpCodeRefVal = firebaseRsvpCodeRef.val();

        /* If hashed version of submitted code exists, run this code */
        if (firebaseRsvpCodeRef.exists()) {

          /* Hide and clear RSVP form part 1, then show part 2 with data */
          $rsvpFormPart1.hide();
          $rsvpCodeField.val("");
          $rsvpCodeNotFoundErr.hide();
          $rsvpFormPart2.show();
          rsvpLoadGuestData(firebaseRsvpCodeRefVal);
          $rsvpFormPart2.attr("data-guest-key", firebaseRsvpCodeRefVal);

          /* If the code does not exist, show an error */
        } else {
          $rsvpCodeNotFoundErr.text("code not found. please double-check your save the date.").show();
        }
      });
    }
  });

/* jQuery Validate Validators | Guestbook
   ========================================================================= */
} else if ($content.hasClass("guestbook-content")) {

  /* Initialize validator for the guestbook form */
  $("#guestbook-form").validate({

    /* Don't ignore any fields to allow validation of hidden fields */
    ignore: [],

    /* Validation rules for each form field */
    rules: {
      "guestbook-form-name": {
        required: true
      },
      "guestbook-form-note": {
        required: true
      },
      "guestbook-form-g-recaptcha": {

        /**
         * Make the guestbook reCAPTCHA required only if it has not been
         * completed.
         * @return { Boolean } - False if reCAPTCHA completed, true otherwise.
         */
        required() {
          if (grecaptcha.getResponse().length) {
            return false;
          }

          return true;
        }
      }
    },

    /* Custom error messages for each guestbook form field */
    messages: {
      "guestbook-form-name": {
        required: "please tell us your name(s)."
      },
      "guestbook-form-note": {
        required: "please leave us a note."
      },
      "guestbook-form-g-recaptcha": {
        required: "please indicate you're not a robot (it seems silly, we know)."
      }
    },

    /* Tell plugin where to display the form field error */
    errorPlacement($error, $element) {

      /* Get this element's name that has an error */
      const fieldName = $element.attr("name");

      /* Use the field name + "-error" to build class and place the error */
      $(`.${fieldName}-error`).append($error);
    },

    /**
     * When the guestbook form is submitted and valid, save the submitted
     * message to Firebase, clear the form, and then scroll user to bottom of
     * page where the new message was added.
     * @return { Void } Returns no value
     */
    submitHandler() {

      /* Save the name, note, and current time of the message to Firebase */
      firebaseGuestbookRef.push().set({
        name: $guestbookNameField.val(),
        note: $guestbookNoteField.val(),
        date: new Date().getTime()
      });

      /* Clear the form */
      $guestbookNameField.val("");
      $guestbookNoteField.val("");
      grecaptcha.reset();

      /* Scroll user to the bottom of the page where their message was added */
      $htmlBody.animate({scrollTop: $document.height() - $window.height()}, 500, "swing");
    }
  });
}

/* =========================================================================
   Other
   ========================================================================= */

/* Initialize FlexSlider slideshows */
$(".slideshow").flexslider({
  animation: "slide",
  directionNav: true,
  slideshowSpeed: 3000,
  minItems: 1,
  animationLoop: false,
  move: 1
});

/* Other | RSVP
   ========================================================================= */
if ($content.hasClass("rsvp-content")) {

  /* Handles the submission of the second part of the RSVP form */
  $("#rsvp-form-part-2").submit((e) => {

    /* Stop the form from running its default submit action */
    e.preventDefault();

    /* Get all checkboxes on the form and loop through them */
    const $rsvpFormPart2Data = $rsvpFormPart2.find('input[type="checkbox"]');

    $rsvpFormPart2Data.each((index) => {

      /* Get checkbox for this guest and update Firebase with submitted val */
      const $rsvpFormPart2Checkbox = $($rsvpFormPart2Data[index]);

      firebaseRsvpGuestsRef.child(`${$rsvpFormPart2.attr("data-guest-key")}/${index + 1}`).update({ "attending": $rsvpFormPart2Checkbox.prop("checked")});
    });

    /* Hide part 2 of the RSVP form and show the confirmation message */
    $rsvpFormPart2.hide();
    $rsvpFormConfirmation.fadeIn(1000);
  });

/* Other | Guestbook
   ========================================================================= */
} else if ($content.hasClass("guestbook-content")) {

  /* Query Firebase guestbook and order messages by date */
  firebaseGuestbookRef.orderByChild("date").on("child_added", (message) => {

    /* Get val of data point and use name and note props to add new message */
    const messageVal = message.val();

    addGuestbookMessage(messageVal.name, messageVal.note);
  });
}
