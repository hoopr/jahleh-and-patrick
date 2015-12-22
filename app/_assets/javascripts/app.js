$(document).ready(function() {
	$("a[href='" + location.pathname + "']").parent().addClass("active");

	$("#slider_jahlpat").flexslider({
		animation: "slide",
		slideshowSpeed: 3000,
		minItems: 1,
		animationLoop: false,
		move: 1
	});
	$("#slider_beachhouse").flexslider({
		animation: "slide",
		slideshowSpeed: 3000,
		minItems: 1,
		animationLoop: false,
		move: 1
	});

	$("#rsvpCodeForm").validate({
		rules: {
			code: {
				required: true,
				remote: {
					url: "/rsvpForms",
					type: "get",
					data: {
						code: function() {
							return $("#code").val();
						}
					}
				}
			}
		},
		messages: {
			code: {
				required: "please enter a code.",
				remote: "code not found. please double-check your save the date."
			}
		},
		errorLabelContainer: '#rsvpCodeErrors',
		submitHandler: function(form) {
			form.submit();
		}
	});

	$("#rsvpPeopleForm").submit(function(event) {
		event.preventDefault();
		$.ajax({
		  type: "post",
		  url: "/rsvpForms",
		  data: $(this).serialize()
		});
		$(this).hide();
		$("#rsvpConfirmation").fadeIn(1000);
		return false;
	});

	$("#guestbookForm").validate({
		rules: {
			name: {
				required: true
			},
			note: {
				required: true
			}
		},
		messages: {
			name: {
				required: "please tell us your name(s)."
			},
			note: {
				required: "please leave us a note."
			}
		},
		errorPlacement: function ($error, $element) {
	        var name = $element.attr("name");
	        $("#guestbookError" + name).append($error);
	   	},
		submitHandler: function(form) {
			$.ajax({
			  type: "post",
			  url: "/guestbook",
			  data: {
			  	name: function() {
			  		return $("#name").val();
			  	},
			  	note: function() {
			  		return $("#note").val();
			  	}
			  }
			});
			var name = $("#name").val();
			var note =  $("#note").val();
			var entry =
				"<hr /> \
				<br /> \
				<div class='guestbookEntry'> \
					<p class='guestbookEntryName'>" + name + ":</p> \
					<p class='guestbookEntryNote'>\"" + note + "\"</p> \
				</div> \
				<br />";
			$("#guestbook_messages").append(entry);
			$("#name").val("");
			$("#note").val("");
			$('html, body').animate({scrollTop: $(document).height()-$(window).height()}, 500, "swing");
		}
	});
});
