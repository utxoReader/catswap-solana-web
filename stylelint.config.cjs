/**
 * Stylelint Configuration for Design System
 * 
 * Enforces CSS/Tailwind best practices and prevents design drift.
 */

module.exports = {
  extends: ['stylelint-config-standard'],
  plugins: ['stylelint-order'],
  rules: {
    // ============================================
    // COLOR ENFORCEMENT
    // ============================================
    
    // Prevent hardcoded hex colors in CSS
    'color-no-hex': [
      true,
      {
        message: 'Hardcoded hex colors are forbidden. Use CSS variables from DESIGN_SYSTEM_TOKENS.md',
      },
    ],
    
    // Prevent rgb/rgba without CSS variables
    'function-disallowed-list': [
      ['rgb', 'rgba'],
      {
        message: 'Use CSS variables instead of rgb()/rgba(). Define colors in :root',
      },
    ],

    // ============================================
    // TAILWIND ENFORCEMENT
    // ============================================
    
    // Enforce logical order (Tailwind plugin sorts classes)
    'order/order': [
      [
        'custom-properties',
        'dollar-variables',
        { type: 'at-rule', name: 'apply' },
        'declarations',
        { type: 'at-rule', name: 'media' },
        'rules',
      ],
      { severity: 'warning' },
    ],

    // ============================================
    // FONT ENFORCEMENT
    // ============================================
    
    // Prevent custom font declarations
    'property-disallowed-list': [
      {
        'font-family': 'Use font-sans from Tailwind instead of custom font-family',
      },
    ],

    // ============================================
    // GENERAL BEST PRACTICES
    // ============================================
    
    'declaration-empty-line-before': null,
    'comment-empty-line-before': null,
    'custom-property-pattern': [
      '^(--[a-z]+-[a-z]+(-[a-z]+)*)$',
      {
        message: 'CSS variables should follow naming convention: --category-name (e.g., --color-buy, --bg-primary)',
      },
    ],
  },
  ignoreFiles: ['dist/**/*', 'node_modules/**/*'],
};
