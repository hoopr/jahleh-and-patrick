/* =========================================================================
   Variables
   ========================================================================= */
const $window = $(window);
const $document = $(document);
const $htmlBody = $('html, body');
const $rsvpFormPart1 = $('#rsvp-form-part-1');
const $rsvpCodeField = $('#rsvp-form-part-1-code');
const $rsvpCodeNotFoundErr = $('.rsvp-form-part-1-code-not-found-error label');
const $rsvpFormPart2 = $('#rsvp-form-part-2');
const $rsvpFormConfirmation = $('.rsvp-form-confirmation');
const $guestbookNameField = $('#guestbook-form-name');
const $guestbookNoteField = $('#guestbook-form-note');
const firebaseRef = new Firebase('https://jahleh-and-patrick.firebaseio.com');
const firebaseRSVPCodesRef = firebaseRef.child('rsvp/codes');
const firebaseRSVPGuestsRef = firebaseRef.child('rsvp/guests');
const firebaseGuestbookRef = firebaseRef.child('guestbook');

/* =========================================================================
   Functions
   ========================================================================= */

/**
 * Function that logs out a user from a past session and then logs in a user
 * anonymously when they have successfully entered an RSVP code.
 *
 * @returns { Promise }
 */
function rsvpAnonymousLogin() {

  /* Return a Promise object */
  return new Promise((resolve, reject) => {

    /* Clear any past sessions */
    firebaseRef.unauth();

    /* Log a user in anonymously */
    firebaseRef.authAnonymously((error) => {

      /* If there's an error, reject Promise */
      if (error) {
        return reject(error);
      }

      /* If logging in is successful, resolve the Promise */
      resolve();

      /* Don't save the login state */
    }, {
      remember: 'none'
    });
  });
}

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
 *
 * @returns { Void } Returns no value
 */
function rsvpLoadGuestData(firebaseRSVPGuestKey) {

  /* Get the login Promise */
  const rsvpAuth = rsvpAnonymousLogin();

  /* When Promise resolves, query the RSVP guests */
  rsvpAuth.then(() => {

    /* Count number of guest checkboxes added */
    let guestCount = 1;

    /* Query Firebase RSVP guests based on the provided key */
    firebaseRSVPGuestsRef.child(firebaseRSVPGuestKey).orderByKey().on('child_added', (guest) => {

      /* Find the submit button and add HTML for a new input before it */
      $rsvpFormPart2.find('.btn').before(addGuestCheckbox(guestCount, guest.val().name, guest.val().attending ? 'checked' : ''));

      /* Increase the guest checkbox count */
      guestCount++;
    });
  })

  /* If Promise rejects, catch error */
  .catch(() => {});
}

/**
 * Callback function that validates the Google reCAPTCHA when it's complete.
 *
 * @returns { Void } Returns no value
 */
function updateReCAPTCHAValidation() {

  // Manually remove reCAPTCHA error when user completes it
  $('#guestbook-form-g-recaptcha').removeClass('error').addClass('valid');
  $('.guestbook-form-g-recaptcha-error label').hide();
}

/**
 * Function that creates the HTML for a guestbook message and appends it to
 * the messages container.
 *
 * @returns { Void } Returns no value
 */
function addGuestbookMessage(name, note) {

  /* Add initial HTML for a guestbook message */
  const message = `
    <hr>
    <section class="guestbook-message">
      <p class="guestbook-message-name">${name}:</p>
      <p class="guestbook-message-note">${note}</p>
    </section>
  `;

  /* Append the message to the messages container */
  $('.guestbook-messages').append(message);
}

/* =========================================================================
   Scripts
   ========================================================================= */

/* Initialize FlexSlider slideshows */
$('.slideshow').flexslider({
  animation: 'slide',
  directionNav: true,
  slideshowSpeed: 3000,
  minItems: 1,
  animationLoop: false,
  move: 1
});

/* Do the following only on the RSVP page */
if ($('.content').hasClass('rsvp-content')) {

  /* Initialize validator for the RSVP Code form */
  $('#rsvp-form-part-1').validate({

    /* Validation rules */
    rules: {
      'rsvp-form-part-1-code': {
        required: true
      }
    },

    /* Custom error messages for each Guestbook form field */
    messages: {
      'rsvp-form-part-1-code': {
        required: 'please enter a code.'
      }
    },

    /* Tell plugin where to display the form field error */
    errorPlacement($error, $element) {

      /* Get the element's name that has an error */
      const fieldName = $element.attr('name');

      /* Use the field name + '-error' to build the class and place the error */
      $(`.${fieldName}-error`).append($error);
    },

    /* What to do when the Guestbook form is submitted and valid */
    submitHandler() {

      /* Query the Firebase RSVP codes */
      firebaseRSVPCodesRef.once('value', (codes) => {

        /* Get a Firebase ref to the submitted code and then its value */
        const firebaseRSVPCodeRef = codes.child(sha512($rsvpCodeField.val()));
        const firebaseRSVPCodeRefVal = firebaseRSVPCodeRef.val();

        /* If hashed version of submitted code exists, run this code */
        if (firebaseRSVPCodeRef.exists()) {
          $rsvpFormPart1.hide(); // Hide RSVP code form
          $rsvpCodeField.val(''); // Clear RSVP code field
          $rsvpCodeNotFoundErr.hide(); // Hide RSVP code not found error
          $rsvpFormPart2.show(); // Show RSVP guests form
          rsvpLoadGuestData(firebaseRSVPCodeRefVal); // Fill RSVP guest form
          $rsvpFormPart2.attr('data-guest-key', firebaseRSVPCodeRefVal);

          /* If the code does not exist, show an error */
        } else {
          $rsvpCodeNotFoundErr.text('code not found. please double-check your save the date.').show();
        }
      });
    }
  });

  $('#rsvp-form-part-2').submit((e) => {
    e.preventDefault();
    const $rsvpFormPart2Data = $rsvpFormPart2.find('input[type="checkbox"]');
    $rsvpFormPart2Data.each((index) => {
      const $rsvpFormPart2Checkbox = $($rsvpFormPart2Data[index]);
      firebaseRSVPGuestsRef.child(`${$rsvpFormPart2.attr('data-guest-key')}/${index + 1}`).update({ 'attending': $rsvpFormPart2Checkbox.prop('checked')});
    });
    $rsvpFormPart2.hide();
    $rsvpFormConfirmation.fadeIn(1000);
  });

  /* Do the following only on the Guestbook page */
} else if ($('.content').hasClass('guestbook-content')) {

  /* Initialize validator for the Guestbook form */
  $('#guestbook-form').validate({

    /* Don't ignore any fields to allow validation of hidden fields */
    ignore: [],

    /* Validation rules */
    rules: {
      'guestbook-form-name': {
        required: true
      },
      'guestbook-form-note': {
        required: true
      },
      'guestbook-form-g-recaptcha': {

        /* Guestbook reCAPTCHA is required only if it has not been completed */
        required() {
          if (grecaptcha.getResponse().length) {
            return false;
          }

          return true;
        }
      }
    },

    /* Custom error messages for each Guestbook form field */
    messages: {
      'guestbook-form-name': {
        required: 'please tell us your name(s).'
      },
      'guestbook-form-note': {
        required: 'please leave us a note.'
      },
      'guestbook-form-g-recaptcha': {
        required: "please indicate you're not a robot (it seems silly, we know)."
      }
    },

    /* Tell plugin where to display the form field error */
    errorPlacement($error, $element) {

      /* Get the element's name that has an error */
      const fieldName = $element.attr('name');

      /* Use the field name + '-error' to build the class and place the error */
      $(`.${fieldName}-error`).append($error);
    },

    /* What to do when the Guestbook form is submitted and valid */
    submitHandler() {

      /* Save the name, note, and current time of the message to Firebase */
      firebaseGuestbookRef.push().set({
        name: $guestbookNameField.val(),
        note: $guestbookNoteField.val(),
        date: new Date().getTime()
      });

      /* Clear the form */
      $guestbookNameField.val('');
      $guestbookNoteField.val('');
      grecaptcha.reset();

      /* Scroll user to the bottom of the page where their message was added */
      $htmlBody.animate({scrollTop: $document.height() - $window.height()}, 500, 'swing');
    }
  });

  /* Query Firebase Guestbook */
  firebaseGuestbookRef.orderByChild('date').on('child_added', (message) => {

    /* Get a specific data point */
    const messageVal = message.val();

    /* Call function to add the HTML for each message (data point) */
    addGuestbookMessage(messageVal.name, messageVal.note);
  });
}
