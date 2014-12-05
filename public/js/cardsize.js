;(function($) {
  $(window).resize(function() {
    var cards = $('.card');
    if (cards.length > 0) {
      cards.height($(cards[0]).width() * 1.452);
      $('.war').height($(cards[0]).height() + 25);
    }
  });
  $('.card').ready(function() {
    var cards = $('.card');
    if (cards.length > 0) {
      cards.height($(cards[0]).width() * 1.452);
      $('.war').height($(cards[0]).height() + 25);
    }
  });
})(jQuery);
