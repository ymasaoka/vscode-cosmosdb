@echo on

echo Cleaning up
if exist dist rd /s /q dist

echo Building
call npm run build
if errorlevel 1 goto error

echo Creating dist
md dist
cd dist
copy ..\package.json .
md out
md resources
md grammar
xcopy /s ..\out out > nul
xcopy /s ..\resources resources > nul
xcopy /s ..\grammar grammar > nul
if errorlevel 1 goto error

echo Creating production-only node_modules
call npm i vscode
if errorlevel 1 goto error
call npm i --only=production
if errorlevel 1 goto error
rd /s /q node_modules\vscode
move node_modules out\

echo Creating ASAR archive
del /s *.map
del /s *.ts
if errorlevel 1 goto error
call asar pack out out.asar
if errorlevel 1 goto error

echo Preparing for package
call npm i
if errorlevel 1 goto error

echo Creating package
copy ..\.vscodeignore .
call npm run package
if errorlevel 1 goto error

goto end

:error
echo Error

:end
cd ..
