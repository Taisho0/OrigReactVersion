import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import { RouterProvider } from 'react-router-dom'
import { router } from './router'
import { AuthContextProvider } from './auth/AuthContext'
import SiteFooter from './components/SiteFooter'

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <div className="flex flex-col relative">  
      <h2 className='mt-10 text-center text-2xl/5 font-bold tracking-tight text-white'>
        Welcome to the Originals Printing Co. App!
      </h2>
      <AuthContextProvider>
        <RouterProvider router={router}/>
      </AuthContextProvider>

      <SiteFooter></SiteFooter>
    </div>
  </StrictMode>,
)
