import axios from 'axios'

export const http = axios.create({
	// Use relative base URL so that dev environment goes through Vite proxy (/api -> backend)
	// and production can be served behind the same origin.
	baseURL: '/api/v1',
	timeout: 15000,
})
