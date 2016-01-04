/* =========================================================================
   Variables
   ========================================================================= */
const firebaseRef = new Firebase('https://jahleh-and-patrick.firebaseio.com');

/* =========================================================================
   Functions
   ========================================================================= */

/**
 * Function that creates the HTML for a guestbook message and appends it to
 * the messages container.
 *
 * @returns { Void } Returns no value
 */
function addGuestbookMessage(name, note) {

  // Add initial HTML for a guestbook message
  let message = '<hr>';
  message += '<section class="guestbook-message">';

  // Add the HTML for the name and note
  message += '<p class="guestbook-message-name">' + name + ':</p>';
  message += '<p class="guestbook-message-note">' + note + '</p>';

  // Close the HTML section
  message += '</section>';

  // Append the message to the messages container
  $('.guestbook-messages').append(message);
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

/* Do the following only on the Guestbook page */
if ($('.content').hasClass('guestbook-content')) {

  /* Create ref to Firebase data for Guestbook page */
  const firebaseGuestbookRef = firebaseRef.child('guestbook');

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
        required: function guestbookFormReCAPTCHARequired() {
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
      $('.' + fieldName + '-error').append($error);
    },

    /* What to do when the Guestbook form is submitted and valid */
    submitHandler() {

      /* Get the Guestbook name and note fields */
      const $nameField = $('#guestbook-form-name');
      const $noteField = $('#guestbook-form-note');

      /* Save the name, note, and current time of the message to Firebase */
      firebaseGuestbookRef.push().set({
        name: $nameField.val(),
        note: $noteField.val(),
        date: new Date().getTime()
      });

      /* Clear the form */
      $nameField.val('');
      $noteField.val('');
      grecaptcha.reset();

      /* Scroll user to the bottom of the page where their message was added */
      $('html, body').animate({scrollTop: $(document).height() - $(window).height()}, 500, 'swing');
    }
  });

  /* Query Firebase Guestbook */
  firebaseGuestbookRef.orderByChild('date').on('child_added', function queryGuestbook(message) {

    /* Get a specific data point */
    const messageVal = message.val();

    /* Call function to add the HTML for each message (data point) */
    addGuestbookMessage(messageVal.name, messageVal.note);
  });
}

  // $('#rsvpCodeForm').validate({
  //   rules: {
  //     code: {
  //       required: true,
  //       remote: {
  //         url: '/rsvpForms',
  //         type: 'get',
  //         data: {
  //           code: function () {
  //             return $('#code').val();
  //           }
  //         }
  //       }
  //     }
  //   },
  //   messages: {
  //     code: {
  //       required: 'please enter a code.',
  //       remote: 'code not found. please double-check your save the date.'
  //     }
  //   },
  //   errorLabelContainer: '#rsvpCodeErrors',
  //   submitHandler: function (form) {
  //     form.submit();
  //   }
  // });

  // $('#rsvpPeopleForm').submit(function (event) {
  //   event.preventDefault();
  //   $.ajax({
  //     type: 'post',
  //     url: '/rsvpForms',
  //     data: $(this).serialize()
  //   });
  //   $(this).hide();
  //   $('#rsvpConfirmation').fadeIn(1000);
  //   return false;
  // });
