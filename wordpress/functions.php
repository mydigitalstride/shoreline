<?php
/**
 * Digital Stride Landing Theme Functions
 */

if ( ! defined( 'ABSPATH' ) ) {
    exit;
}

// -------------------------------------------------------------------------
// Theme Setup
// -------------------------------------------------------------------------
function ds_theme_setup() {
    add_theme_support( 'title-tag' );
    add_theme_support( 'post-thumbnails' );
    add_theme_support( 'html5', [ 'search-form', 'comment-form', 'gallery', 'caption', 'script', 'style' ] );
    add_theme_support( 'custom-logo', [
        'height'      => 60,
        'width'       => 200,
        'flex-width'  => true,
        'flex-height' => true,
    ] );

    register_nav_menus( [
        'primary' => __( 'Primary Navigation', 'digital-stride-landing' ),
        'footer'  => __( 'Footer Navigation', 'digital-stride-landing' ),
    ] );
}
add_action( 'after_setup_theme', 'ds_theme_setup' );

// -------------------------------------------------------------------------
// Enqueue Scripts & Styles
// -------------------------------------------------------------------------
function ds_enqueue_assets() {
    $version = wp_get_theme()->get( 'Version' );

    wp_enqueue_style(
        'ds-landing',
        get_template_directory_uri() . '/assets/css/landing.css',
        [],
        $version
    );

    wp_enqueue_script(
        'ds-landing',
        get_template_directory_uri() . '/assets/js/landing.js',
        [],
        $version,
        true
    );
}
add_action( 'wp_enqueue_scripts', 'ds_enqueue_assets' );

// -------------------------------------------------------------------------
// ACF Local JSON – save & load from theme's acf-json folder
// -------------------------------------------------------------------------
function ds_acf_json_save_point( $path ) {
    return get_stylesheet_directory() . '/acf-json';
}
add_filter( 'acf/settings/save_json', 'ds_acf_json_save_point' );

function ds_acf_json_load_point( $paths ) {
    $paths[] = get_stylesheet_directory() . '/acf-json';
    return $paths;
}
add_filter( 'acf/settings/load_json', 'ds_acf_json_load_point' );

// -------------------------------------------------------------------------
// ACF Options Page – Global site settings (nav logo, footer info, etc.)
// -------------------------------------------------------------------------
function ds_register_options_page() {
    if ( function_exists( 'acf_add_options_page' ) ) {
        acf_add_options_page( [
            'page_title' => 'Site Settings',
            'menu_title' => 'Site Settings',
            'menu_slug'  => 'ds-site-settings',
            'capability' => 'edit_posts',
            'redirect'   => false,
        ] );
    }
}
add_action( 'acf/init', 'ds_register_options_page' );

// -------------------------------------------------------------------------
// Helper: get image URL from ACF image field (handles both array and ID)
// -------------------------------------------------------------------------
function ds_get_image_url( $image, $size = 'large' ) {
    if ( empty( $image ) ) {
        return '';
    }
    if ( is_array( $image ) ) {
        return $image['sizes'][ $size ] ?? $image['url'] ?? '';
    }
    $src = wp_get_attachment_image_src( $image, $size );
    return $src ? $src[0] : '';
}

// -------------------------------------------------------------------------
// Helper: output ACF image as <img> tag with alt text
// -------------------------------------------------------------------------
function ds_render_image( $image, $size = 'large', $class = '', $attrs = [] ) {
    if ( empty( $image ) ) {
        return;
    }
    $url = ds_get_image_url( $image, $size );
    $alt = is_array( $image ) ? ( $image['alt'] ?? '' ) : get_post_meta( $image, '_wp_attachment_image_alt', true );
    $class_attr = $class ? ' class="' . esc_attr( $class ) . '"' : '';
    $extra = '';
    foreach ( $attrs as $k => $v ) {
        $extra .= ' ' . esc_attr( $k ) . '="' . esc_attr( $v ) . '"';
    }
    echo '<img src="' . esc_url( $url ) . '" alt="' . esc_attr( $alt ) . '"' . $class_attr . $extra . '>';
}
