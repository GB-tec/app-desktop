; installer.nsh - Configurações personalizadas para o instalador NSIS

; Configurações do instalador
!define APPNAME "GB Sistemas - Prefeitura"
!define COMPANYNAME "GB Sistemas"
!define DESCRIPTION "Sistema de Gestão para Prefeitura"

; Configurações de versão
VIProductVersion "${VERSION}"
VIAddVersionKey "ProductName" "${APPNAME}"
VIAddVersionKey "CompanyName" "${COMPANYNAME}"
VIAddVersionKey "LegalCopyright" "© ${COMPANYNAME}"
VIAddVersionKey "FileDescription" "${DESCRIPTION}"
VIAddVersionKey "FileVersion" "${VERSION}"
VIAddVersionKey "ProductVersion" "${VERSION}"

; Configurações visuais
BGGradient 0x0F2027 0x203A43 0x2C5364
SetCompressor /SOLID lzma

; Mensagens personalizadas
LangString welcome ${LANG_PORTUGUESE} "Bem-vindo ao instalador do GB Sistemas - Prefeitura!$\n$\nEste assistente irá guiá-lo através da instalação do ${APPNAME}.$\n$\nRecomenda-se fechar todas as outras aplicações antes de continuar."

LangString finish ${LANG_PORTUGUESE} "A instalação do ${APPNAME} foi concluída com sucesso.$\n$\nClique em Finalizar para sair do instalador."

; Páginas personalizadas
!define MUI_WELCOMEPAGE_TITLE "Instalador GB Sistemas"
!define MUI_WELCOMEPAGE_TEXT "$(welcome)"
!define MUI_FINISHPAGE_TITLE "Instalação Concluída"
!define MUI_FINISHPAGE_TEXT "$(finish)"

; Configurações de desinstalação
!define MUI_UNCONFIRMPAGE_TEXT_TOP "O ${APPNAME} será removido do seu computador."

; Funções customizadas
Function .onInit
  ; Verifica se já existe uma instalação
  ReadRegStr $R0 HKLM "Software\Microsoft\Windows\CurrentVersion\Uninstall\${APPNAME}" "UninstallString"
  StrCmp $R0 "" done
  
  MessageBox MB_OKCANCEL|MB_ICONEXCLAMATION \
  "${APPNAME} já está instalado. $\n$\nClique em OK para remover a versão anterior ou Cancelar para cancelar a instalação." \
  IDOK uninst
  Abort

uninst:
  ClearErrors
  ExecWait '$R0 _?=$INSTDIR'
  
  IfErrors no_remove_uninstaller done
  no_remove_uninstaller:
  
done:
FunctionEnd

Function .onInstSuccess
  ; Executa após a instalação bem-sucedida
  MessageBox MB_YESNO "Deseja executar o ${APPNAME} agora?" IDNO NoLaunch
  Exec "$INSTDIR\${APPNAME}.exe"
  NoLaunch:
FunctionEnd