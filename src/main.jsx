import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import './styles/fonts.css'
import './styles/theme.css'
import { RouterProvider } from 'react-router-dom'
import { router } from './router'
import { AuthContextProvider } from './auth/AuthContext'
import { StoreProvider } from './context/StoreContext'

// Prevent right-click context menu (client-side only; not a security feature)
if (typeof window !== 'undefined') {
  window.addEventListener('contextmenu', (e) => {
    e.preventDefault();
  });
}

const preventDragStart = (event) => {
  event.preventDefault();
};

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <div className="flex flex-col relative" onDragStartCapture={preventDragStart}>  
      <AuthContextProvider>
        <StoreProvider>
          <RouterProvider router={router}/>
        </StoreProvider>
      </AuthContextProvider>
    </div>
  </StrictMode>,
)
