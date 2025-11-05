echo ================================================
echo Student Life Hub - By Team J.A.D.E.
echo ================================================

if [! -d "frontend/node_modules"]; then
  echo Installing frontend dependencies...
  cd frontend
  npm install
  cd ..
  echo
fi

if [! -d "backend/node_modules"]; then
  echo Installing backend dependencies...
  cd backend
  npm install
  cd ..
  echo
fi

echo Starting servers...
echo
echo Frontend: http://localhost:5173
echo Backend API: http://localhost:3001
echo
echo Press Ctrl+C to stop all servers
echo ================================================
echo

cd backend && npm run dev

sleep 3
