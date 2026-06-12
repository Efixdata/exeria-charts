import os
import json
import urllib.request
import urllib.error

# Automatyczne pobranie zmiennych z systemu GitHub Actions
api_key = os.environ.get("GEMINI_API_KEY")
github_token = os.environ.get("GITHUB_TOKEN")
repo = os.environ.get("GITHUB_REPOSITORY")
event_path = os.environ.get("GITHUB_EVENT_PATH")

def main():
    print("🚀 Uruchamiam skrypt do Code Review...")
    
    # 1. Odczytanie numeru PR ze zdarzenia GitHuba
    with open(event_path, "r") as f:
        event_data = json.load(f)
    
    pr_number = event_data.get("pull_request", {}).get("number")
    if not pr_number:
        print("❌ To nie jest zdarzenie Pull Request. Przerywam działanie.")
        return

    print(f"📦 Przetwarzanie Pull Requesta #{pr_number}")

    # 2. Pobranie zmian w kodzie (diff)
    diff_url = f"https://api.github.com/repos/{repo}/pulls/{pr_number}"
    
    # NAPRAWIONO: Dodano brakujące "v3" i usunięto konfliktujący nagłówek
    diff_headers = {
        "Authorization": f"Bearer {github_token}",
        "Accept": "application/vnd.github.v3.diff", 
        "User-Agent": "Gemini-Code-Review-Bot"
    }
    
    diff_req = urllib.request.Request(diff_url, headers=diff_headers)
    
    try:
        with urllib.request.urlopen(diff_req) as response:
            diff_content = response.read().decode('utf-8')
    except urllib.error.HTTPError as e:
        print(f"❌ Błąd HTTP pobierania diff: {e.code} {e.reason}")
        print(f"Szczegóły: {e.read().decode('utf-8')}")
        return
    except Exception as e:
        print(f"❌ Błąd podczas pobierania zmian z GitHuba: {e}")
        return

    if not diff_content:
        print("ℹ️ Brak zmian w kodzie do przeanalizowania.")
        return

    print("✅ Pobrano zmiany. Wysyłam zapytanie do API Gemini...")

    # 3. Wysłanie zapytania do modelu gemini-3.1-pro-preview
    gemini_url = f"https://generativelanguage.googleapis.com/v1beta/models/gemini-3.1-pro-preview:generateContent?key={api_key}"
    prompt = (
        "Jesteś doświadczonym Senior Developerem. Zrób wnikliwe code review poniższych zmian. "
        "Wskaż potencjalne błędy, luki bezpieczeństwa i zaproponuj optymalizacje. "
        "Jeśli kod wygląda dobrze, pochwal autora. Bądź konkretny i zwięzły.\n\n"
        f"Zmiany:\n{diff_content}"
    )
    
    payload = {"contents": [{"parts": [{"text": prompt}]}]}
    gemini_req = urllib.request.Request(
        gemini_url, 
        data=json.dumps(payload).encode('utf-8'), 
        headers={"Content-Type": "application/json"}
    )
    
    try:
        with urllib.request.urlopen(gemini_req) as response:
            gemini_data = json.loads(response.read().decode('utf-8'))
            review_text = gemini_data["candidates"][0]["content"]["parts"][0]["text"]
            print("✅ Odebrano odpowiedź od sztucznej inteligencji!")
    except urllib.error.HTTPError as e:
        error_body = e.read().decode('utf-8')
        print(f"❌ Błąd HTTP podczas komunikacji z API Gemini: {e.code}")
        print(f"Szczegóły błędu: {error_body}")
        return
    except Exception as e:
        print(f"❌ Błąd podczas komunikacji z API Gemini: {e}")
        return

    # 4. Publikacja komentarza w Pull Requeście
    print("💬 Próbuję dodać komentarz do Pull Requesta...")
    comment_url = f"https://api.github.com/repos/{repo}/issues/{pr_number}/comments"
    comment_payload = {"body": f"### 🤖 Gemini 3.1 Pro Code Review\n\n{review_text}"}
    
    # Pozostawiono wymagane nagłówki dla publikacji komentarza JSON
    comment_headers = {
        "Authorization": f"Bearer {github_token}",
        "Accept": "application/vnd.github+json",
        "X-GitHub-Api-Version": "2022-11-28",
        "User-Agent": "Gemini-Code-Review-Bot"
    }
    
    comment_req = urllib.request.Request(
        comment_url, 
        method="POST", 
        data=json.dumps(comment_payload).encode('utf-8'), 
        headers=comment_headers
    )
    
    try:
        urllib.request.urlopen(comment_req)
        print("🎉 Sukces! Komentarz z review został pomyślnie dodany!")
    except urllib.error.HTTPError as e:
        error_body = e.read().decode('utf-8')
        print(f"❌ Błąd HTTP podczas publikowania komentarza GitHuba: {e.code}")
        print(f"Szczegóły: {error_body}")
    except Exception as e:
        print(f"❌ Błąd podczas publikowania komentarza: {e}")

if __name__ == "__main__":
    main()