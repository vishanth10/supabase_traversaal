from flask import Flask, request, jsonify
from carbon import Carbon
from flask_cors import CORS
import requests
import supabase

app = Flask(__name__)
CORS(app)

# Supabase configuration
SUPABASE_URL = 'https://bktqoxkglmgpnrjmiwc.supabase.co'
SUPABASE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImJrcW90eGtnbG1ncG5yam1pd21jIiwicm9sZSI6ImFub24iLCJpYXQiOjE3MTkzMDQyMzEsImV4cCI6MjAzNDg4MDIzMX0.SBy0NokWpE5iAzhLuZ-6Aus8z_MxYkc0vlp1RK8ZkCU'
supabase_client = supabase.create_client(SUPABASE_URL, SUPABASE_KEY)

# Carbon configuration
CARBON_API_KEY = "a38ee1fe5fef56fc8e1ae2afc881378804bb902882442e1554adae4f82ee23ea"

@app.route('/')
def hello_world():
    return 'Hello, This is working!'

@app.route('/login', methods=['POST'])
def login():
    data = request.json
    email = data['email']
    password = data['password']
    
    response = supabase_client.auth.sign_in_with_password({
        'email': email,
        'password': password
    })
    
    if 'error' in response:
        return jsonify({'error': response['error']['message']}), 400
    
    user_id = response['user']['id']
    
    return jsonify({'user_id': user_id, 'customer_id': user_id})

@app.route('/get_customer_id', methods=['POST'])
def get_customer_id():
    data = request.json
    user_id = data.get('user_id')
    
    # Verify user ID by fetching user details from Supabase
    user_response = supabase_client.auth.api.get_user(user_id)
    if user_response['error']:
        return jsonify({"error": "Invalid user ID"}), 400
    
    customer_id = user_response['user']['id']
    return jsonify({"customer_id": customer_id})

@app.route('/upload', methods=['POST'])
def upload():
    data = request.form
    customer_id = data.get('customer_id')
    file = request.files['file']
    if not customer_id:
        return jsonify({'error': 'Customer ID is required'}), 400
    
    carbon = Carbon(api_key=CARBON_API_KEY, customer_id=customer_id)
    
    try:
        response = carbon.upload_file(file)
        return jsonify({'message': 'File uploaded successfully', 'response': response})
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@app.route('/get_oauth_url', methods=['POST'])
def get_oauth_url():
    data = request.json
    service = data.get('service')
    customer_id = data.get('customer_id')
    
    if not customer_id:
        return jsonify({"error": "Customer ID is required"}), 400
    
    carbon = Carbon(api_key=CARBON_API_KEY, customer_id=customer_id)
    
    if service == "GOOGLE_DRIVE":
        oauth_url = carbon.integrations.get_oauth_url(
            service="GOOGLE_DRIVE",
            scope="https://www.googleapis.com/auth/drive.readonly",
            connecting_new_account=True,
        ).oauth_url
    elif service == "DROPBOX":
        oauth_url = carbon.integrations.get_oauth_url(
            service="DROPBOX",
            connecting_new_account=True,
        ).oauth_url
    elif service == "NOTION":
        oauth_url = carbon.integrations.get_oauth_url(
            service="NOTION",
            connecting_new_account=True,
        ).oauth_url
    else:
        return jsonify({"error": "Invalid service"}), 400

    return jsonify({"oauth_url": oauth_url})

@app.route('/list_user_data_sources', methods=['POST'])
def list_user_data_sources():
    data = request.json
    customer_id = data.get('customer_id')
    
    if not customer_id:
        return jsonify({"error": "Customer ID is required"}), 400
    
    carbon = Carbon(api_key=CARBON_API_KEY, customer_id=customer_id)
    
    response = carbon.data_sources.query_user_data_sources(
        pagination={"limit": 100, "offset": 0},
        order_by="created_at",
        order_dir="desc",
    )
    data_sources = [
        {
            "id": ds.id,
            "external_id": ds.data_source_external_id,
            "type": ds.data_source_type,
            "sync_status": ds.sync_status,
            "created_at": ds.created_at,
            "updated_at": ds.updated_at
        }
        for ds in response.results
    ]
    return jsonify({"data_sources": data_sources})

@app.route('/list_files', methods=['POST'])
def list_files():
    data = request.json
    service = data.get('service')
    customer_id = data.get('customer_id')
    
    if not customer_id:
        return jsonify({"error": "Customer ID is required"}), 400
    
    carbon = Carbon(api_key=CARBON_API_KEY, customer_id=customer_id)
    
    data_source_id = get_data_source_id(service, carbon)
    response = carbon.integrations.list_data_source_items(
        data_source_id=data_source_id,
        filters={},
        pagination={"limit": 250, "offset": 0},
    )
    files = [{"name": file.name} for file in response.items]
    return jsonify({"files": files})

@app.route('/list_uploaded_files', methods=['POST'])
def list_uploaded_files():
    data = request.json
    service = data.get('service')
    customer_id = data.get('customer_id')
    
    if not customer_id:
        return jsonify({"error": "Customer ID is required"}), 400
    
    carbon = Carbon(api_key=CARBON_API_KEY, customer_id=customer_id)
    
    data_source_id = get_data_source_id(service, carbon)
    url = "https://api.carbon.ai/user_files_v2"
    payload = {
        "pagination": {"limit": 100, "offset": 0},
        "order_by": "created_at",
        "order_dir": "desc",
        "filters": {
            "organization_user_data_source_id": [],
            "embedding_generators": ["OPENAI"],
            "include_all_children": True,
        },
        "include_raw_file": True,
        "include_parsed_text_file": True,
        "include_additional_files": True
    }
    headers = {
        "authorization": f"Bearer {CARBON_API_KEY}",
        "customer-id": customer_id,
        "Content-Type": "application/json"
    }
    response = requests.post(url, json=payload, headers=headers)
    uploaded_files = response.json()['results']
    files = [
        {
            "id": file['id'],
            "organization_supplied_user_id": file['organization_supplied_user_id'],
            "organization_user_data_source_id": file['organization_user_data_source_id'],
            "external_url": file['external_url']
        }
        for file in uploaded_files
    ]
    return jsonify({"uploaded_files": files})

@app.route('/search_documents', methods=['POST'])
def search_documents():
    data = request.json
    query = data['query']
    file_ids = data['file_ids']
    customer_id = data.get('customer_id')
    
    if not customer_id:
        return jsonify({"error": "Customer ID is required"}), 400
    
    carbon = Carbon(api_key=CARBON_API_KEY, customer_id=customer_id)
    
    url = "https://api.carbon.ai/embeddings"
    payload = {
        "query": query,
        "k": 2,
        "file_ids": file_ids,
        "include_all_children": True,
        "include_tags": True,
        "include_vectors": True,
        "include_raw_file": True,
        "hybrid_search": False,
        "hybrid_search_tuning_parameters": {
            "weight_a": 0.7,
            "weight_b": 0.2
        },
        "media_type": "TEXT",
        "embedding_model": "OPENAI"
    }
    headers = {
        "authorization": f"Bearer {CARBON_API_KEY}",
        "customer-id": customer_id,
        "Content-Type": "application/json"
    }
    response = requests.post(url, json=payload, headers=headers)
    search_results = response.json()['documents']
    results = [
        {
            "source": result['source'],
            "source_url": result['source_url'],
            "source_type": result['source_type'],
            "presigned_url": result['presigned_url'],
            "tags": result['tags']
        }
        for result in search_results
    ]
    return jsonify({"search_results": results})

def get_data_source_id(service, carbon):
    response = carbon.data_sources.query_user_data_sources(
        pagination={"limit": 100, "offset": 0},
        order_by="created_at",
        order_dir="desc",
        filters={"source": service},
    )
    return response.results[0].id

if __name__ == '__main__':
    app.run(host='localhost', port=3200, debug=True)
