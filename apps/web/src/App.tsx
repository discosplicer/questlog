import { Routes, Route } from 'react-router-dom';
import { Button } from '@questlog/ui';

function HomePage() {
  return (
    <div className='min-h-screen bg-gray-50 flex items-center justify-center'>
      <div className='max-w-md w-full bg-white rounded-lg shadow-md p-8'>
        <h1 className='text-3xl font-bold text-center text-gray-900 mb-8'>
          🗺️ Questlog
        </h1>
        <p className='text-gray-600 text-center mb-8'>
          Transform your tasks into epic quests with AI-powered prioritization
        </p>
        <div className='space-y-4'>
          <Button variant='primary' size='lg' className='w-full'>
            Start Your Adventure
          </Button>
          <Button variant='ghost' size='md' className='w-full'>
            Learn More
          </Button>
        </div>
      </div>
    </div>
  );
}

function App() {
  return (
    <Routes>
      <Route path='/' element={<HomePage />} />
    </Routes>
  );
}

export default App;
