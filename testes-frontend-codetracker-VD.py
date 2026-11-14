# Aluno: Victor Duarte (04251103)
# Turma: 2CCOB - 2026/2

# ====================================================================================================

# --- IMPORTS ---
from playwright.sync_api import sync_playwright, expect, TimeoutError as PlaywrightTimeoutError
import traceback

url_base = "http://localhost:5173"

url_login = url_base
url_pecas = f"{url_base}/pecas"

# --- TESTES ---
with sync_playwright() as p:

    navegador = p.chromium.launch(headless=False)

    pagina = navegador.new_page(viewport={"width": 1300, "height": 1000})

    try:
        # --- TESTES TELA DE LOGIN ---

        pagina.goto(url_login)
        pagina.wait_for_timeout(2000)

        expect(pagina.locator("body")).to_contain_text("Code")
        expect(pagina.locator("body")).to_contain_text("Tracker")
        expect(pagina.locator("body")).to_contain_text("Email")
        expect(pagina.locator("body")).to_contain_text("Senha")

        botao_entrar = pagina.locator("""xpath=//*[@id="root"]/div/div/form/div[3]/button""")
        expect(botao_entrar).to_be_visible()

        # Testar características e comportamento do campo de senha
        input_senha = pagina.locator('input[type="password"]')
        expect(input_senha).to_be_visible()

        input_senha.fill("Abcde")
        expect(input_senha).to_have_value("Abcde")
        input_senha.clear()

        print("\r\n ✅ Testes da tela de login passaram com sucesso! Farmou aura! \r\n")


        # --- TESTES TELA DE PEÇAS ---

        pagina.goto(url_pecas)
        pagina.wait_for_timeout(2000)

        botao_ajuda = pagina.get_by_role(
            "button",
            name="Abrir ajuda desta tela"
        )
        aba_catalogo = pagina.get_by_role(
            "tab",
            name="Catálogo de Peças"
        )
        aba_entradas_saidas = pagina.get_by_role(
            "tab",
            name="Entradas e Saídas"
        )

        # Testar visualizaçao de conteudo principal
        expect(botao_ajuda).to_be_visible()
        expect(aba_catalogo).to_be_visible()
        expect(aba_entradas_saidas).to_be_visible()


        # visualizaçoes da primeira aba
        botao_gerar_etiqueta = pagina.get_by_role(
            "button",
            name="Gerar Etiqueta"
        )
        botao_adicionar_peca = pagina.get_by_role(
            "button",
            name="Adicionar Peça"
        )
        botao_editar = pagina.get_by_role(
            "button",
            name="Editar"
        )
        botao_deletar = pagina.get_by_role(
            "button",
            name="Deletar"
        )
        aba_catalogo.click()
        expect(botao_gerar_etiqueta).to_be_visible()
        expect(botao_adicionar_peca).to_be_visible()
        expect(botao_editar).to_be_visible()
        expect(botao_deletar).to_be_visible()
        
        # visualizaçoes da segunda aba
        aba_entradas_saidas.click()
        expect(botao_gerar_etiqueta).not_to_be_visible()
        expect(botao_adicionar_peca).not_to_be_visible()
        expect(botao_editar).not_to_be_visible()
        expect(botao_deletar).not_to_be_visible()


        
        # Testar recurso de acessibilidade
        expect(botao_ajuda).to_be_visible()

        # quando clica, aparece o popup
        botao_ajuda.click()
        popup = pagina.get_by_role("dialog")
        expect(popup).to_be_visible()

        # fecha no botao X
        botao_fechar_ajuda = pagina.get_by_role(
            "button",
            name="Fechar ajuda"
        )
        botao_fechar_ajuda.click()
        expect(popup).not_to_be_visible()

        # quando tecla F1, aparece o popup
        pagina.keyboard.press("F1")
        popup = pagina.get_by_role("dialog")
        expect(popup).to_be_visible()

        # popup fecha no botao ESC
        pagina.keyboard.press("Escape")
        expect(popup).not_to_be_visible()

        # clica na primeira aba
        # ver se id screen-help-title contem texto Catalogo de Peças
        botao_ajuda.click()
        aba_catalogo.click()
        expect(
            pagina.locator("#screen-help-title")
        ).to_have_text("Catálogo de peças")

        # clica na segunda aba
        # ver se id screen-help-title contem texto Entradas e Saidas
        aba_entradas_saidas.click()
        expect(
            pagina.locator("#screen-help-title")
        ).to_have_text("Entradas e saídas")

        print("\r\n ✅ Testes da tela de peças passaram com sucesso! Farmou aura! \r\n")

        # --- CONCLUSÂO ---
        print("\r\n ✅ Testes passaram com sucesso! Farmou 💯% de aura! \r\n")
    

    except Exception as e:
        print(f"Ocorreu um erro: {e}")

        traceback.print_exc()

    
    finally:
        navegador.close()