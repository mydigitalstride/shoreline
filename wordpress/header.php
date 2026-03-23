<!DOCTYPE html>
<html <?php language_attributes(); ?>>
<head>
    <meta charset="<?php bloginfo( 'charset' ); ?>">
    <meta name="viewport" content="width=device-width, initial-scale=1">
    <link rel="profile" href="https://gmpg.org/xfn/11">
    <?php wp_head(); ?>
</head>
<body <?php body_class(); ?>>
<?php wp_body_open(); ?>

<?php
// Site Settings from ACF Options Page
$nav_logo      = function_exists( 'get_field' ) ? get_field( 'nav_logo', 'option' ) : null;
$header_cta    = function_exists( 'get_field' ) ? get_field( 'header_cta_text', 'option' ) : 'Book Your Consultation';
$header_cta_url = function_exists( 'get_field' ) ? get_field( 'header_cta_url', 'option' ) : '#contact';
?>

<header class="site-header" id="site-header">
    <div class="container">
        <div class="site-header__inner">

            <a href="<?php echo esc_url( home_url( '/' ) ); ?>" class="site-header__logo" aria-label="<?php bloginfo( 'name' ); ?> – Home">
                <?php if ( $nav_logo ) : ?>
                    <img src="<?php echo esc_url( $nav_logo['url'] ); ?>"
                         alt="<?php echo esc_attr( $nav_logo['alt'] ?: get_bloginfo( 'name' ) ); ?>"
                         width="160" height="50">
                <?php elseif ( has_custom_logo() ) : ?>
                    <?php the_custom_logo(); ?>
                <?php else : ?>
                    <span class="site-header__logo-text"><?php bloginfo( 'name' ); ?></span>
                <?php endif; ?>
            </a>

            <nav class="site-nav" aria-label="Primary navigation">
                <?php
                wp_nav_menu( [
                    'theme_location' => 'primary',
                    'menu_class'     => 'site-nav__list',
                    'container'      => false,
                    'fallback_cb'    => function () {
                        echo '<ul class="site-nav__list">
                            <li><a href="#who-we-serve">Who We Serve</a></li>
                            <li><a href="#services">Services</a></li>
                            <li><a href="#about">About Us</a></li>
                            <li><a href="#resources">Resources</a></li>
                        </ul>';
                    },
                ] );
                ?>
            </nav>

            <a href="<?php echo esc_url( $header_cta_url ?: '#contact' ); ?>" class="btn btn--orange btn--sm site-header__cta">
                <?php echo esc_html( $header_cta ?: 'Book Your Consultation' ); ?>
            </a>

            <button class="site-header__mobile-toggle" aria-label="Toggle navigation" aria-expanded="false" aria-controls="mobile-nav">
                <span></span>
                <span></span>
                <span></span>
            </button>

        </div>
    </div>

    <div class="site-header__mobile-nav" id="mobile-nav" hidden>
        <?php
        wp_nav_menu( [
            'theme_location' => 'primary',
            'menu_class'     => 'site-nav__list site-nav__list--mobile',
            'container'      => false,
            'fallback_cb'    => function () {
                echo '<ul class="site-nav__list site-nav__list--mobile">
                    <li><a href="#who-we-serve">Who We Serve</a></li>
                    <li><a href="#services">Services</a></li>
                    <li><a href="#about">About Us</a></li>
                    <li><a href="#resources">Resources</a></li>
                </ul>';
            },
        ] );
        ?>
        <a href="<?php echo esc_url( $header_cta_url ?: '#contact' ); ?>" class="btn btn--orange">
            <?php echo esc_html( $header_cta ?: 'Book Your Consultation' ); ?>
        </a>
    </div>
</header>
