window.onload = function() {
    const main_menu_button = document.getElementById('main-menu-button');
    const main_menu_wrapper = document.getElementById('main-menu-wrapper');

    main_menu_button.addEventListener('click', (event) => {
        main_menu_wrapper.classList.toggle('hidden');
    });
};