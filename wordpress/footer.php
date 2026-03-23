<?php
$footer_logo     = function_exists( 'get_field' ) ? get_field( 'footer_logo', 'option' ) : null;
$footer_email    = function_exists( 'get_field' ) ? get_field( 'footer_email', 'option' ) : 'hello@mydigitalstride.com';
$footer_phone    = function_exists( 'get_field' ) ? get_field( 'footer_phone', 'option' ) : '(717) 123-4567';
$footer_address  = function_exists( 'get_field' ) ? get_field( 'footer_address', 'option' ) : "618 Kings Mill Rd, Suite 101\nYork, PA 17403";
$facebook_url    = function_exists( 'get_field' ) ? get_field( 'facebook_url', 'option' ) : '#';
$instagram_url   = function_exists( 'get_field' ) ? get_field( 'instagram_url', 'option' ) : '#';
$services_links  = function_exists( 'get_field' ) ? get_field( 'footer_services_links', 'option' ) : [];
$header_cta_url  = function_exists( 'get_field' ) ? get_field( 'header_cta_url', 'option' ) : '#contact';
?>

<footer class="site-footer">
    <div class="container">
        <div class="site-footer__inner">

            <div class="site-footer__brand">
                <a href="<?php echo esc_url( home_url( '/' ) ); ?>" class="site-footer__logo">
                    <?php if ( $footer_logo ) : ?>
                        <img src="<?php echo esc_url( $footer_logo['url'] ); ?>"
                             alt="<?php echo esc_attr( $footer_logo['alt'] ?: get_bloginfo( 'name' ) ); ?>"
                             width="160" height="50">
                    <?php elseif ( has_custom_logo() ) : ?>
                        <?php the_custom_logo(); ?>
                    <?php else : ?>
                        <span class="site-footer__logo-text"><?php bloginfo( 'name' ); ?></span>
                    <?php endif; ?>
                </a>

                <div class="site-footer__contact">
                    <?php if ( $footer_email ) : ?>
                        <a href="mailto:<?php echo esc_attr( $footer_email ); ?>">
                            <?php echo esc_html( $footer_email ); ?>
                        </a>
                    <?php endif; ?>

                    <?php if ( $footer_phone ) : ?>
                        <a href="tel:<?php echo esc_attr( preg_replace( '/[^0-9+]/', '', $footer_phone ) ); ?>">
                            <?php echo esc_html( $footer_phone ); ?>
                        </a>
                    <?php endif; ?>

                    <?php if ( $footer_address ) : ?>
                        <address><?php echo nl2br( esc_html( $footer_address ) ); ?></address>
                    <?php endif; ?>
                </div>
            </div>

            <?php if ( ! empty( $services_links ) ) : ?>
            <div class="site-footer__nav">
                <h4 class="site-footer__nav-heading">
                    <span class="site-footer__plus">+</span> Services
                </h4>
                <ul class="site-footer__nav-list">
                    <?php foreach ( $services_links as $link ) : ?>
                        <?php if ( ! empty( $link['label'] ) ) : ?>
                            <li>
                                <a href="<?php echo esc_url( $link['url'] ?? '#' ); ?>">
                                    <?php echo esc_html( $link['label'] ); ?>
                                </a>
                            </li>
                        <?php endif; ?>
                    <?php endforeach; ?>
                </ul>
            </div>
            <?php else : ?>
            <div class="site-footer__nav">
                <h4 class="site-footer__nav-heading">
                    <span class="site-footer__plus">+</span> Services
                </h4>
                <ul class="site-footer__nav-list">
                    <li><a href="#">Website Design</a></li>
                    <li><a href="#">Local SEO</a></li>
                    <li><a href="#">Social Media</a></li>
                    <li><a href="#">Paid Advertising</a></li>
                    <li><a href="#">CRM Automation</a></li>
                    <li><a href="#">Email Marketing</a></li>
                </ul>
            </div>
            <?php endif; ?>

            <div class="site-footer__cta-col">
                <a href="<?php echo esc_url( $header_cta_url ?: '#contact' ); ?>" class="btn btn--orange">
                    Book Your Consultation
                </a>

                <div class="site-footer__social">
                    <?php if ( $facebook_url ) : ?>
                        <a href="<?php echo esc_url( $facebook_url ); ?>" class="site-footer__social-link" aria-label="Facebook" target="_blank" rel="noopener noreferrer">
                            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" width="20" height="20" fill="currentColor" aria-hidden="true">
                                <path d="M18 2h-3a5 5 0 0 0-5 5v3H7v4h3v8h4v-8h3l1-4h-4V7a1 1 0 0 1 1-1h3z"/>
                            </svg>
                        </a>
                    <?php endif; ?>

                    <?php if ( $instagram_url ) : ?>
                        <a href="<?php echo esc_url( $instagram_url ); ?>" class="site-footer__social-link" aria-label="Instagram" target="_blank" rel="noopener noreferrer">
                            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
                                <rect x="2" y="2" width="20" height="20" rx="5" ry="5"/>
                                <path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z"/>
                                <line x1="17.5" y1="6.5" x2="17.51" y2="6.5"/>
                            </svg>
                        </a>
                    <?php endif; ?>
                </div>
            </div>

        </div>
    </div>
</footer>

<?php wp_footer(); ?>
</body>
</html>
