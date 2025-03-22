/** @type {import('tailwindcss').Config} */
export default {
	content: ['./src/**/*.{html,js,svelte,ts}'],
	theme: {
		extend: {
			colors: {
				primary: '#6366f1',
				'primary-light': '#818cf8',
				'primary-dark': '#4f46e5'
			},
			boxShadow: {
				sm: '0 1px 2px 0 rgba(0, 0, 0, 0.03)',
				DEFAULT: '0 1px 3px 0 rgba(0, 0, 0, 0.1), 0 1px 2px 0 rgba(0, 0, 0, 0.06)',
				md: '0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)',
				lg: '0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05)',
				xl: '0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)',
				floating: '0 8px 30px rgba(0, 0, 0, 0.12)'
			},
			borderRadius: {
				xl: '0.75rem',
				'2xl': '1rem'
			},
			transitionProperty: {
				height: 'height',
				spacing: 'margin, padding'
			}
		}
	},
	plugins: []
};
