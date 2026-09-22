"use strict";
/** Language DOM projection; app.ts retains state, storage, translations and controllers. */
var AppLanguage;
(function (AppLanguage) {
    function render(labels) {
        const ko = labels.lang === 'ko';
        document.documentElement.lang = labels.lang;
        document.querySelectorAll('.lang-option').forEach(element => {
            element.classList.toggle('active', element.dataset.lang === labels.lang);
        });
        const search = document.querySelector('.search-input');
        if (search) {
            search.placeholder = labels.searchPlaceholder;
            search.setAttribute('aria-label', ko ? 'ISM 검색' : 'Search ISMs');
        }
        document.getElementById('lang-toggle')?.setAttribute('aria-label', labels.toggleLabel);
        const footer = document.querySelector('.site-footer');
        if (footer?.children[0])
            footer.children[0].textContent = labels.footerTitle;
        if (footer?.children[1])
            footer.children[1].textContent = labels.footerGenerator;
        const text = (selector, value) => {
            const element = document.querySelector(selector);
            if (element)
                element.textContent = value;
        };
        text('#finder-trigger', ko ? '스타일 찾기' : 'Find a style');
        text('#style-finder-title', ko ? '나에게 맞는 스타일 찾기' : 'Find a visual direction');
        text('.finder-dialog-header .atlas-kicker', ko ? '세 가지 질문으로 좁혀보세요' : 'Narrow it down with three questions');
        document.getElementById('finder-dialog-close')?.setAttribute('aria-label', ko ? '닫기' : 'Close');
        text('.catalog-entry-copy .atlas-kicker', ko ? '디자인 카탈로그' : 'Explore the encyclopedia');
        text('#catalog-entry-title', ko ? '구현 레퍼런스 탐색' : 'Explore implementation references');
        text('.catalog-entry-copy > p:last-child', ko
            ? '효과, 색상, 타이포그래피, 레이아웃과 모션을 주제별로 살펴보세요.'
            : 'Explore effects, color, typography, layout, and motion by topic.');
        document.querySelector('.catalog-entry-links')?.setAttribute('aria-label', ko ? '디자인 카탈로그' : 'Design catalogs');
    }
    AppLanguage.render = render;
})(AppLanguage || (AppLanguage = {}));
