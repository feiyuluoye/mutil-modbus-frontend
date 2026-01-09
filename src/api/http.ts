import axios from 'axios'
import { env } from '@/config/env'

export const http = axios.create({
	baseURL: env.apiBaseUrl,
	timeout: env.apiTimeout,
	headers: {
		'Content-Type': 'application/json',
	},
})

// Request interceptor
http.interceptors.request.use(
	(config) => {
		// Add auth token if exists
		const token = localStorage.getItem('token')
		if (token) {
			config.headers.Authorization = `Bearer ${token}`
		}
		return config
	},
	(error) => {
		return Promise.reject(error)
	}
)

// Response interceptor
http.interceptors.response.use(
	(response) => {
		return response
	},
	(error) => {
		// Handle common errors
		if (error.response) {
			switch (error.response.status) {
				case 401:
					// Unauthorized - redirect to login
					localStorage.removeItem('token')
					window.location.href = '/login'
					break
				case 403:
					console.error('Access forbidden')
					break
				case 404:
					console.error('Resource not found')
					break
				case 500:
					console.error('Server error')
					break
				default:
					console.error('Request failed:', error.response.status)
			}
		} else if (error.request) {
			console.error('No response from server')
		} else {
			console.error('Request error:', error.message)
		}
		return Promise.reject(error)
	}
)
