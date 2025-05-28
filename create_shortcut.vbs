Set WshShell = CreateObject("WScript.Shell")
strDesktop = WshShell.SpecialFolders("Desktop")
currentDir = CreateObject("Scripting.FileSystemObject").GetAbsolutePathName(".")

' Создаем ярлык
Set oShellLink = WshShell.CreateShortcut(strDesktop & "\CURSA - Система нормоконтроля.lnk")
oShellLink.TargetPath = currentDir & "\start_app.bat"
oShellLink.WorkingDirectory = currentDir
oShellLink.Description = "Запуск системы нормоконтроля документов CURSA"
oShellLink.IconLocation = currentDir & "\frontend\public\favicon.ico, 0"
oShellLink.Save

WScript.Echo "Ярлык успешно создан на рабочем столе!" 