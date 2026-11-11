import { createBrowserRouter, Outlet, RouterProvider } from 'react-router-dom'
import { UpdatePrompt } from './app/UpdatePrompt'
import { CapturePage } from './features/capture/CapturePage'
import { CropPage } from './features/crop/CropPage'
import { DocumentPage } from './features/document/DocumentPage'
import { LibraryPage } from './features/library/LibraryPage'
import { PageEditorPage } from './features/page-editor/PageEditorPage'

function Layout() {
  return (
    <div className="flex min-h-full flex-col">
      <Outlet />
      <UpdatePrompt />
    </div>
  )
}

const router = createBrowserRouter([
  {
    element: <Layout />,
    children: [
      { path: '/', element: <LibraryPage /> },
      { path: '/doc/:id', element: <DocumentPage /> },
      { path: '/doc/:id/page/:pageId/crop', element: <CropPage /> },
      { path: '/doc/:id/page/:pageId/edit', element: <PageEditorPage /> },
      { path: '/scan', element: <CapturePage /> },
    ],
  },
])

export default function App() {
  return <RouterProvider router={router} />
}
