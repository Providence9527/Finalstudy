@echo off
setlocal enabledelayedexpansion

set "searchFiles=MaterialCard.jsx Diy.jsx  learning.js"
set "outfile=src.txt"

del "%outfile%" 2>nul

for %%i in (%searchFiles%) do (
    for /r %%f in (%%i) do (
        type "%%f" >> "%outfile%"
        echo. >> "%outfile%"
    )
)

endlocal
