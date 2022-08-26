import socket

host, port = '127.0.0.1' , 8888

serverSocket = socket.socket(socket.AF_INET, socket.SOCK_STREAM)
serverSocket.setsockopt(socket.SOL_SOCKET, socket.SO_REUSEADDR, 1)
serverSocket.bind((host, port))
serverSocket.listen(1)
print('Server en el puerto', port)

while True:
    connection , address = serverSocket.accept()
    request = connection.recv(1024).decode('utf-8')
    #print(request)

    string_List = request.split(' ')
    method = string_List[0]
    requesting_file = string_List[1]

    print('Client request', requesting_file)

    myFile = requesting_file.split('?')[0]
    myFile = myFile.lstrip('/')

    if (myFile == ''):
        myFile = 'index.html'

    try:
        file = open(myFile , 'rb')
        response = file.read()
        file.close()

        header = 'HTTP/1.1 200 OK\n'

        if (myFile.endswith('.jpg')):
            mimetype = 'image/jpg'
        elif (myFile.endswith('.css')):
            mimetype = 'text/css'
        elif (myFile.endswith('.pdf')):
            mimetype = 'application/pdf'
        else:
            mimetype = 'text/html'

        header += 'Content-Type: ' + str(mimetype)+'\n\n'

    except Exception as e:
        header = 'HTTP/1.1 404 Not Found\n\n'
        response = '<html><body>Error 404: File not found</body></html>'.encode('utf-8')

    final_Response = header.encode('utf-8')
    final_Response += response
    connection.send(final_Response)
    connection.close()