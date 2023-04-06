// JavaScript Document

// HASH
var locationHash = window.location.hash;
if ( locationHash.match('^#\/') ) {
    locationHash = undefined;
} else if ( locationHash ) {
    window.location.hash = '';
}

// LOAD
$('html').addClass('loadWait');

// $window load timeout.
var commonloadTimeoutTime = 3000;
var commonloadTimer = setTimeout(
  function(){
    $( window ).load();
  }, commonloadTimeoutTime
);

$( window ).one('load', function(){

  clearTimeout( commonloadTimer );
  $('html').removeClass('loadWait');
  
  // Anker scroll
  if( locationHash ) {
    if ( $( locationHash ).length ) {
      window.location.hash = locationHash;
      $('html, body').scrollTop( 0 );
      setTimeout(function(){
      
        var $target = $( locationHash ),
            headerHeight = ( $('#menuBar').length )? $('#menuBar').outerHeight(): 0,
            subMenuHeight = ( $('#contentsMenu').lenght )? $('#contentsMenu').outerHeight(): 0;
        
        var scrollPosition = 0;
            
        if ( $target.is('.tabContent') ) {
          scrollPosition = $target.closest('section').offset().top - headerHeight - subMenuHeight;
        } else {
          scrollPosition = $target.offset().top - headerHeight - subMenuHeight;
        }
            
        $('html, body').animate({ scrollTop: scrollPosition }, 300, 'swing');
        if( $( locationHash ).is('.toggleHeading') ) {
          setTimeout(function(){
            $( locationHash ).click();
          }, 400 );
        }
      }, 100 );
    }
  }
});

(function(){

/*
##################################################
   jQuery object
##################################################
*/
const $w = $( window ),
      $b = $('body'),
      $bar = $('#menuBar');

/*
##################################################
   Events
##################################################
*/
const ev = {
    down: ( 'onpointerdown' in window ) ? 'pointerdown' : 'mousedown',
    up: ( 'onpointerup' in window ) ? 'pointerup' : 'mouseup',
    enter: ( 'onpointerenter' in window ) ? 'pointerenter' : 'mouseenter',
    leave: ( 'onpointerleave' in window ) ? 'pointerleave' : 'mouseleave',
    over: ( 'onpointerover' in window ) ? 'pointerover' : 'mouseover',
    out: ( 'onpointerout' in window ) ? 'pointerout' : 'mouseout',
    move: ( 'onpointermove' in window ) ? 'pointermove' : 'mouasemove',
    cancel: ( 'onpointercancel' in window ) ? 'pointercancel' : 'touchcancel',
    wheel: 'wheel',
    click: 'click',
    resize: 'resize',
    scroll: 'scroll'
};

/*
##################################################
   Header menu width check
##################################################
*/
const hMenuName = ev.resize + '.hMenu',
      hMenuExastroMenuWidth = $bar.find('.menuBar-ExastroMenu').outerWidth(),
      hMenuLogoWidth = $bar.find('.menuBar-Logo').outerWidth(),
      hMenuMainWidth = $bar.find('.menuBar-MainMenu').outerWidth(),
      hMenuSubWidth = $bar.find('.menuBar-SubMenu').outerWidth(),
      hMenuLangageWidth = $bar.find('.menuBar-Langage').outerWidth(),
      hMenuMain = hMenuExastroMenuWidth + hMenuLogoWidth + hMenuMainWidth,
      hMenuHamWidth = 40;

const headerWidthCheck = function(){
    const bw = $w.width();
    if ( bw < hMenuMain + hMenuSubWidth + hMenuLangageWidth ) {
        $bar.addClass('subHide');
        if ( bw < hMenuMain + hMenuLangageWidth + hMenuHamWidth ) {
            $bar.addClass('menuHide');
        } else {
            $bar.removeClass('menuHide');
        }
    } else {
        $bar.removeClass('menuHide subHide');
    }
};
headerWidthCheck();

let resizeMenuCheckTimer;
$w.on( hMenuName, function(){
    clearTimeout( resizeMenuCheckTimer );
    resizeMenuCheckTimer = setTimeout( function() {
      headerWidthCheck();
    }, 200 );
}); 

/*
##################################################
   Exastro menu
##################################################
*/
const eMenuName = '.eMenu',
      eMenuClick = ev.click + eMenuName,
      eMenuPointerDown = ev.down + eMenuName;
$bar.find('.menuBar-Btn').on( eMenuClick, function(){
    const $btn = $( this ),
          type = $btn.attr('data-menu'),
          parent = '.' + $btn.attr('data-menuParent'),
          open = type + 'Open';
    if ( $bar.is( '.' + open ) ) {
        $bar.removeClass( open );
        $w.off( eMenuPointerDown + type );
    } else {
        $bar.addClass( open );
        $w.on( eMenuPointerDown + type, function(e){ 
            if ( !$( e.target ).closest( parent ).length ) {
                $btn.removeClass('popupHide').click();
            }
        });
    }
});

/*
##################################################
   Hover
##################################################
*/
const hoverName = '.hover',
      hoverEnter = ev.enter + hoverName,
      hoverLeave = ev.leave + hoverName;
$b.on( hoverEnter, '.touch', function(){
    var $this = $( this);
    $this.addClass('hover').on( hoverLeave, function(){
        $this.off( hoverLeave ).removeClass('hover');
    });
});

/*
##################################################
   goto Top
##################################################
*/

$w.on( ev.scroll + '.gotoTop', function(){
    
    const $t = $('.gotoTop');
    
    if ( $w.height() < $w.scrollTop() ) {
        $t.addClass('show');
    } else {
        $t.removeClass('show');
    }

});

/*
##################################################
   ImageBox Open
##################################################
*/
$('.loupe').on( ev.click, function(){
    const $d = $( document ),
          $img = $( this );
    
    if ( $('#imageBox').length ) {
        $('#imageBox').remove();
    }
    
    const imageBox = '<div id="imageBox"><div class="imageBoxInner">'
      + '<ul class="imageBoxMenu">'
      + '<li><button class="close touch"><i class="fas fa-times-circle"></i></button></li>'
      + '</ul>'
      + '<div class="image"></div>'
      + '</div></div>';

    $b.addClass('imageOpen').append( imageBox );

    const imageHTML = $img.find('img').clone(),
          $imageBox = $('#imageBox');

    const closeImageBox = function() {
        $d.off('keydown.closeImg');
        $imageBox.remove();
        $b.removeClass('imageOpen');
    };

    $imageBox.find('.image').html( imageHTML );

    imageHTML.on('load', function(){
        // Close click close
        $imageBox.find('button.close, .imageBoxInner').on('click', function(){
            closeImageBox();
        });
        // stopPropagation
        $imageBox.find('.imageBoxMenu, img').on('click', function( e ){
            e.stopPropagation();
        });
        // Esc click close
        $d.on('keydown.closeImg', function( e ){
            if(e.keyCode === 27 ) {
              closeImageBox();
            }
        });
    });
});

/*
##################################################
   Popup
##################################################
*/
const popupName = '.popup',
      popupEnter = ev.enter + popupName,
      popupLeave = ev.leave + popupName,
      popupClick = ev.click + popupName;
$b.on( popupEnter, '.popup', function(){
    const $t = $( this ),
          ttl = $t.attr('title');
    if ( ttl !== undefined ) {
        $t.removeAttr('title');

        const $p = $('<div/>', {
            'class': 'popupBlock',
            'text': ttl
        });
        
        $b.append( $p );
        
        const r = $t[0].getBoundingClientRect(),
              m = 8,
              wW = $w.width(),
              tW = $t.outerWidth(),
              tH = $t.outerHeight(),
              tL = r.left,
              tT = r.top,
              pW = $p.outerWidth(),
              pH = $p.outerHeight();

        let l = ( tL + tW / 2 ) - ( pW / 2 ),
            t = tT - pH - m;
        
        if ( t <= 0 ) {
            $p.addClass('popupBottom');
            t = tT + tH + m;
        } else {
            $p.addClass('popupTop');
        }
        if ( wW < l + pW ) l = wW - pW - m;
        if ( l <= 0 ) l = m;
        
        $p.css({
            'width': pW,
            'height': pH,
            'left': l,
            'top': t
        });
        
        if ( $t.is('.popupHide') ) {
            $p.addClass('popupHide');
        }
        
        $t.on( popupLeave, function(){
            const $p = $b.find('.popupBlock'),
                  title = $p.text();
            $p.remove();
            $t.off( popupLeave + ' ' + popupClick ).attr('title', title );
        });
        
        $t.on( popupClick, function(){
            if ( $t.attr('data-popupMode') === 'click') {
               if ( $t.is('.popupHide') ) {
                    $t.add( $p ).removeClass('popupHide');
                } else {
                    $t.add( $p ).addClass('popupHide');
                }
            }
        });

        const targetCheck = function(){
            if ( $t.is(':visible') ) {
                if ( $p.is(':visible') ) {
                    setTimeout( targetCheck, 200 );
                }
            } else {
                $p.remove();
            }              
        };
        targetCheck();
    }
});

// Tab Contents
$('.tabContents, .webinarContainer').each( function(){
    var $tabContents = $( this ),
        openTabNum = ( $tabContents.attr('data-open-tab') === undefined )? 0: $tabContents.attr('data-open-tab');
    $( this ).children('.tabMenu, .webinarVersionSelect').find('.tabMenuItem, .webinarVersionItem').eq( openTabNum ).addClass('tabOpen');
    $( this ).children('.tabContent, .webinarContent').eq( openTabNum ).addClass('tabOpen');
});
$('.tabMenuLink, .webinarVersionLink').on('click', function( e ){
    e.preventDefault();
    var $a = $( this ),
        $tabMenuItem = $a.parent(),
        $targetTab = $( $a.attr('href') );
    $tabMenuItem.siblings('.tabOpen').removeClass('tabOpen');
    $tabMenuItem.closest('.tabContents, .webinarContainer').children('.tabOpen').removeClass('tabOpen');
    $tabMenuItem.addClass('tabOpen');
    $targetTab.addClass('tabOpen');
});

// News Room tab
$('.documentSetInner').each( function(){
    $( this ).children('.documentSetMenu').find('.documentSetMenuItem').eq(0).addClass('tabOpen');
    $( this ).children('.documentSetContent').eq(0).addClass('tabOpen');
});
$('.documentSetMenuLink').on('click', function( e ){
    e.preventDefault();
    var $tabMenuItem = $( this ).parent(),
        $targetTab = $( $( this ).attr('href') );
    $tabMenuItem.siblings('.tabOpen').removeClass('tabOpen');
    $tabMenuItem.closest('.documentSetInner').children('.tabOpen').removeClass('tabOpen');
    $tabMenuItem.addClass('tabOpen');
    $targetTab.addClass('tabOpen');
});

}());


/*
##################################################
   YouTube
##################################################
*/

// "YouTube iframe Player API" Set
function youTubeIframeAPISet() {
    var youtubeScript = document.createElement('script');
    youtubeScript.src = 'https://www.youtube.com/iframe_api';
    $('body').append( youtubeScript );
    
    // thumbnail
    $('.youtubeEmbed').each( function() {
      var $youtubeEmbed = $( this ),
          youTubeID = $youtubeEmbed.attr('data-embed-id'),
          thumbnailURL = 'https://i.ytimg.com/vi/' + youTubeID + '/sddefault.jpg';
      $youtubeEmbed.addClass('ready').css('background-image', 'url(' + thumbnailURL + ')');      
    });
}
// "Yotube iframe Player API" Ready
function onYouTubeIframeAPIReady() {
    var $youtubeEmbed = $('.youtubeEmbed');  
    
    $youtubeEmbed.on('click', function(){
      var $loadYouTube = $( this ),
          loadYouTubeID = $loadYouTube.attr('data-embed-id'),
          width = $loadYouTube.width(),
          height = $loadYouTube.outerHeight(),
          start = Number( $loadYouTube.attr('data-start-time') );
      if ( start === undefined ) start = 0;
      console.log(start)
      $loadYouTube.removeClass('ready').addClass('loading');
      
      var ytPlayer = new YT.Player(
        loadYouTubeID, {
          width: width,
          height: height,
          videoId: loadYouTubeID,
          playerVars: {
            'autoplay': 1,
            'start': start,
          },
          events: {
            'onReady': function(){
              $loadYouTube.removeClass('loading').addClass('done');
            }
          }
        }
      );
      
      $('#' + loadYouTubeID ).on('load', function(){
        $loadYouTube.removeClass('loading').addClass('done');
      });
    });
}