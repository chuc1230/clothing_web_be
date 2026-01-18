# base image 
FROM node:20

# thiet lap thu muc lam viec cho container
WORKDIR /app/back_end

# sao chep file package*.json 
COPY package*.json ./

# cai dat cac dependencies 
RUN npm install

# sao chep toan bo source code vao container
COPY . .

# thiet lap port cho container
EXPOSE 4000

# chay ung dung
CMD ["node", "index.js"]