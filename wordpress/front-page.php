<?php
/**
 * Template Name: Landing Page (Front Page)
 * Template Post Type: page
 *
 * The front-page template. Uses ACF Flexible Content to render sections.
 */

if ( ! defined( 'ABSPATH' ) ) {
    exit;
}

get_header();

// Bail gracefully if ACF is not active.
if ( ! function_exists( 'have_rows' ) ) {
    echo '<div class="container" style="padding:4rem 1rem;">
        <p><strong>ACF Flexible Content</strong> field not available. Please install and activate Advanced Custom Fields.</p>
    </div>';
    get_footer();
    return;
}
?>

<main id="main-content" class="landing-page">

<?php if ( have_rows( 'page_sections' ) ) : ?>
    <?php while ( have_rows( 'page_sections' ) ) : the_row(); ?>

        <?php
        // ================================================================
        // LAYOUT: Hero Section
        // ================================================================
        if ( get_row_layout() === 'hero_section' ) :
            $badge       = get_sub_field( 'badge_text' );
            $headline    = get_sub_field( 'headline' );
            $description = get_sub_field( 'description' );
            $cta_text    = get_sub_field( 'cta_text' );
            $cta_url     = get_sub_field( 'cta_url' );
            $hero_image  = get_sub_field( 'hero_image' );
        ?>
        <section class="section-hero" aria-label="Hero">
            <div class="container">
                <div class="section-hero__inner">
                    <div class="section-hero__content">
                        <?php if ( $badge ) : ?>
                            <p class="section-hero__badge">
                                <span class="badge-dot" aria-hidden="true"></span>
                                <?php echo esc_html( $badge ); ?>
                            </p>
                        <?php endif; ?>

                        <?php if ( $headline ) : ?>
                            <h1 class="section-hero__headline">
                                <?php
                                $lines = array_filter( array_map( 'trim', explode( "\n", $headline ) ) );
                                foreach ( $lines as $line ) {
                                    echo '<span>' . esc_html( $line ) . '</span>';
                                }
                                ?>
                            </h1>
                        <?php endif; ?>

                        <?php if ( $description ) : ?>
                            <p class="section-hero__description"><?php echo esc_html( $description ); ?></p>
                        <?php endif; ?>

                        <?php if ( $cta_text && $cta_url ) : ?>
                            <a href="<?php echo esc_url( $cta_url ); ?>" class="btn btn--orange btn--arrow">
                                <?php echo esc_html( $cta_text ); ?>
                                <svg class="btn__arrow-icon" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
                                    <line x1="5" y1="12" x2="19" y2="12"/>
                                    <polyline points="12 5 19 12 12 19"/>
                                </svg>
                            </a>
                        <?php endif; ?>
                    </div>

                    <?php if ( $hero_image ) : ?>
                        <div class="section-hero__image-wrap">
                            <?php ds_render_image( $hero_image, 'large', 'section-hero__image', [ 'loading' => 'eager' ] ); ?>
                        </div>
                    <?php endif; ?>
                </div>
            </div>
        </section>

        <?php
        // ================================================================
        // LAYOUT: Logo Carousel
        // ================================================================
        elseif ( get_row_layout() === 'logo_carousel' ) :
            $logos = get_sub_field( 'logos' );
            if ( ! empty( $logos ) ) :
        ?>
        <section class="section-logos" aria-label="Partners and clients">
            <div class="logo-carousel" data-logo-carousel>
                <div class="logo-carousel__track-wrap">
                    <div class="logo-carousel__track" data-carousel-track>
                        <?php
                        // Duplicate logos for seamless infinite loop
                        $all_logos = array_merge( $logos, $logos );
                        foreach ( $all_logos as $logo_item ) :
                            $logo_img = $logo_item['logo_image'] ?? null;
                            $company  = $logo_item['company_name'] ?? '';
                            $logo_url = $logo_item['logo_url'] ?? '';
                        ?>
                            <div class="logo-carousel__slide">
                                <?php $tag = $logo_url ? 'a' : 'div'; ?>
                                <<?php echo esc_attr( $tag ); ?>
                                    class="logo-carousel__card"
                                    <?php if ( $logo_url ) echo 'href="' . esc_url( $logo_url ) . '" target="_blank" rel="noopener noreferrer"'; ?>
                                >
                                    <?php if ( $logo_img ) : ?>
                                        <?php ds_render_image( $logo_img, 'medium', 'logo-carousel__logo', [ 'loading' => 'lazy' ] ); ?>
                                    <?php elseif ( $company ) : ?>
                                        <span class="logo-carousel__text"><?php echo esc_html( $company ); ?></span>
                                    <?php endif; ?>
                                </<?php echo esc_attr( $tag ); ?>>
                            </div>
                        <?php endforeach; ?>
                    </div>
                </div>
                <div class="logo-carousel__dots" data-carousel-dots aria-label="Carousel navigation" role="tablist">
                    <?php foreach ( $logos as $i => $_ ) : ?>
                        <button
                            class="logo-carousel__dot<?php echo $i === 0 ? ' is-active' : ''; ?>"
                            data-dot="<?php echo esc_attr( $i ); ?>"
                            role="tab"
                            aria-selected="<?php echo $i === 0 ? 'true' : 'false'; ?>"
                            aria-label="Go to slide <?php echo esc_attr( $i + 1 ); ?>"
                        ></button>
                    <?php endforeach; ?>
                </div>
            </div>
        </section>
        <?php endif; ?>

        <?php
        // ================================================================
        // LAYOUT: Stats Section
        // ================================================================
        elseif ( get_row_layout() === 'stats_section' ) :
            $stats = get_sub_field( 'stats' );
            if ( ! empty( $stats ) ) :
        ?>
        <section class="section-stats" aria-label="Key statistics">
            <div class="container">
                <div class="section-stats__grid">
                    <?php foreach ( $stats as $stat ) :
                        $number = $stat['stat_number'] ?? '';
                        $label  = $stat['stat_label'] ?? '';
                    ?>
                        <div class="section-stats__item">
                            <?php if ( $number ) : ?>
                                <p class="section-stats__number"><?php echo esc_html( $number ); ?></p>
                            <?php endif; ?>
                            <?php if ( $label ) : ?>
                                <p class="section-stats__label"><?php echo esc_html( $label ); ?></p>
                            <?php endif; ?>
                        </div>
                    <?php endforeach; ?>
                </div>
            </div>
        </section>
        <?php endif; ?>

        <?php
        // ================================================================
        // LAYOUT: Services Section
        // ================================================================
        elseif ( get_row_layout() === 'services_section' ) :
            $section_title = get_sub_field( 'section_title' );
            $services      = get_sub_field( 'services' );
            if ( ! empty( $services ) ) :
        ?>
        <section class="section-services" id="services" aria-label="Services">
            <div class="container">
                <?php if ( $section_title ) : ?>
                    <div class="section-services__header">
                        <h2 class="section-services__title"><?php echo esc_html( $section_title ); ?></h2>
                        <div class="section-services__crosses" aria-hidden="true">
                            <?php for ( $c = 0; $c < 7; $c++ ) echo '<span>+</span>'; ?>
                        </div>
                    </div>
                <?php endif; ?>

                <div class="section-services__grid">
                    <?php foreach ( $services as $service ) :
                        $s_title  = $service['service_title'] ?? '';
                        $s_desc   = $service['service_description'] ?? '';
                        $s_bg     = $service['background_image'] ?? null;
                        $s_cta    = $service['cta_text'] ?? 'View Service';
                        $s_url    = $service['cta_url'] ?? '#';
                        $bg_url   = $s_bg ? ds_get_image_url( $s_bg, 'large' ) : '';
                    ?>
                        <article
                            class="service-card"
                            <?php if ( $bg_url ) echo 'style="--service-bg:url(' . esc_url( $bg_url ) . ')"'; ?>
                        >
                            <div class="service-card__inner">
                                <h3 class="service-card__title"><?php echo esc_html( $s_title ); ?></h3>
                                <div class="service-card__reveal">
                                    <?php if ( $s_desc ) : ?>
                                        <p class="service-card__description"><?php echo esc_html( $s_desc ); ?></p>
                                    <?php endif; ?>
                                    <?php if ( $s_url ) : ?>
                                        <a href="<?php echo esc_url( $s_url ); ?>" class="btn btn--white btn--sm service-card__btn">
                                            <?php echo esc_html( $s_cta ); ?>
                                        </a>
                                    <?php endif; ?>
                                </div>
                            </div>
                        </article>
                    <?php endforeach; ?>
                </div>
            </div>
        </section>
        <?php endif; ?>

        <?php
        // ================================================================
        // LAYOUT: Results / Video Section
        // ================================================================
        elseif ( get_row_layout() === 'results_section' ) :
            $media_type   = get_sub_field( 'media_type' ) ?: 'video';
            $video_file   = get_sub_field( 'video_file' );
            $video_poster = get_sub_field( 'video_poster' );
            $result_image = get_sub_field( 'results_image' );
            $result_stats = get_sub_field( 'result_stats' );

            $video_url    = is_array( $video_file ) ? ( $video_file['url'] ?? '' ) : '';
            $poster_url   = $video_poster ? ds_get_image_url( $video_poster, 'large' ) : '';
        ?>
        <section class="section-results" aria-label="Results">
            <div class="section-results__inner">

                <div class="section-results__media">
                    <?php if ( $media_type === 'video' && $video_url ) : ?>
                        <video
                            class="section-results__video"
                            autoplay muted loop playsinline
                            <?php if ( $poster_url ) echo 'poster="' . esc_url( $poster_url ) . '"'; ?>
                        >
                            <source src="<?php echo esc_url( $video_url ); ?>" type="video/mp4">
                            <?php if ( $poster_url ) : ?>
                                <img src="<?php echo esc_url( $poster_url ); ?>" alt="Results showcase">
                            <?php endif; ?>
                        </video>
                    <?php elseif ( $result_image ) : ?>
                        <?php ds_render_image( $result_image, 'large', 'section-results__image' ); ?>
                    <?php endif; ?>
                </div>

                <?php if ( ! empty( $result_stats ) ) : ?>
                    <div class="section-results__stats">
                        <?php foreach ( $result_stats as $rs ) :
                            $rs_icon   = $rs['icon_image'] ?? null;
                            $rs_number = $rs['result_number'] ?? '';
                            $rs_label  = $rs['result_label'] ?? '';
                        ?>
                            <div class="result-stat">
                                <?php if ( $rs_icon ) : ?>
                                    <div class="result-stat__icon">
                                        <?php ds_render_image( $rs_icon, 'thumbnail', 'result-stat__icon-img' ); ?>
                                    </div>
                                <?php endif; ?>
                                <?php if ( $rs_number ) : ?>
                                    <p class="result-stat__number"><?php echo esc_html( $rs_number ); ?></p>
                                <?php endif; ?>
                                <?php if ( $rs_label ) : ?>
                                    <p class="result-stat__label"><?php echo nl2br( esc_html( $rs_label ) ); ?></p>
                                <?php endif; ?>
                            </div>
                        <?php endforeach; ?>
                    </div>
                <?php endif; ?>

            </div>
        </section>

        <?php
        // ================================================================
        // LAYOUT: Testimonial Section
        // ================================================================
        elseif ( get_row_layout() === 'testimonial_section' ) :
            $quote       = get_sub_field( 'quote_text' );
            $author_name = get_sub_field( 'author_name' );
            $author_title = get_sub_field( 'author_title' );
        ?>
        <section class="section-testimonial" aria-label="Testimonial">
            <div class="container">
                <figure class="testimonial">
                    <?php if ( $quote ) : ?>
                        <blockquote class="testimonial__quote">
                            <p><?php echo esc_html( $quote ); ?></p>
                        </blockquote>
                    <?php endif; ?>
                    <figcaption class="testimonial__author">
                        <?php if ( $author_name ) : ?>
                            <strong><?php echo esc_html( $author_name ); ?></strong>
                        <?php endif; ?>
                        <?php if ( $author_title ) : ?>
                            <span>, <?php echo esc_html( $author_title ); ?></span>
                        <?php endif; ?>
                    </figcaption>
                </figure>
            </div>
        </section>

        <?php
        // ================================================================
        // LAYOUT: CTA Section
        // ================================================================
        elseif ( get_row_layout() === 'cta_section' ) :
            $cta_headline    = get_sub_field( 'headline' );
            $cta_subheadline = get_sub_field( 'subheadline' );
            $cta_btn_text    = get_sub_field( 'button_text' );
            $cta_btn_url     = get_sub_field( 'button_url' );
        ?>
        <section class="section-cta" id="contact" aria-label="Call to action">
            <div class="container">
                <div class="section-cta__inner">
                    <?php if ( $cta_headline ) : ?>
                        <h2 class="section-cta__headline"><?php echo esc_html( $cta_headline ); ?></h2>
                    <?php endif; ?>
                    <?php if ( $cta_subheadline ) : ?>
                        <p class="section-cta__subheadline"><?php echo esc_html( $cta_subheadline ); ?></p>
                    <?php endif; ?>
                    <?php if ( $cta_btn_text && $cta_btn_url ) : ?>
                        <a href="<?php echo esc_url( $cta_btn_url ); ?>" class="btn btn--orange btn--lg">
                            <?php echo esc_html( $cta_btn_text ); ?>
                        </a>
                    <?php endif; ?>
                </div>
            </div>
        </section>

        <?php endif; // end layout checks ?>

    <?php endwhile; ?>
<?php else : ?>
    <div class="container" style="padding:4rem 1rem;">
        <p>No sections have been added yet. Edit this page and add flexible content sections.</p>
    </div>
<?php endif; ?>

</main>

<?php get_footer(); ?>
