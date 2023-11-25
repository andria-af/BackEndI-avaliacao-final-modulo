import { randomUUID } from 'crypto';
import express from 'express';
import bcrypt from 'bcrypt';
import jwt from "jsonwebtoken";

const app = express();
app.use(express.json());


let verifyJwt = function (req, res, next) {
  
    jwt.verify(req.body.accessToken, "growdev", (err, user) => {
      if (err) {
        return res.status(400).json("Access token inválido");
      }
      req.user = user;
      next();
    });
};

// Criar usuario
// Não pode ter mais de um usuário com o mesmo e-mail
let usuarios= []

app.post('/usuario', async (request, response) => {

    if (request.body.nome === null){
        return response.status(400).json("Nome não informado!")
    }

    if (request.body.email === null){
        return response.status(400).json("Email não informado!")
    }

    if (request.body.senha === null){
        return response.status(400).json("Senha não informada!")
    }

    const mesmoEmail= usuarios.some((usuario)=>{
      return usuario.email === request.body.email    
    });

    if (mesmoEmail) {
        response.status(400).send("Email já cadastrado.")
    } else {

        const hashedSenha= await bcrypt.hash(request.body.senha, 6);

        const usuario= {
            identificador: randomUUID(),
            nome: request.body.nome,
            email: request.body.email,
            senha: hashedSenha,
        }
        usuarios.push(usuario);
        return response.status(200).send("Usuário cadastrado com sucesso.");
    }

});

// Ver usuarios
app.get('/usuario', (request, response) => {
    return response.status(200).json(usuarios);
});


// Logar usuario
// O login deve ser feito com e-mail e senha
app.post('/usuario/login', async (request, response) => {

    if (request.body.email === undefined){
        return response.status(400).json("Email não informado!")
    }

    if (request.body.senha === undefined){
        return response.status(400).json("Senha não informada!")
    }

    const usuarioEncontrado= usuarios.find((usuario)=>{ 
        return usuario.email === request.body.email; 
    })

    if (usuarioEncontrado){

        const hashedSenha= await bcrypt.compare(
            request.body.senha,
            usuarioEncontrado.senha         
        );

        if (hashedSenha === true) {
    
            const access_token = jwt.sign(
                {
                  nome: usuarioEncontrado.nome, 
                  email: usuarioEncontrado.email,
                },
                "growdev",
                {
                  expiresIn: "1d",
                }
              );
            
              return response.status(200).json({
                access_token,
              });
    
        } else {
            response.status(400).send("Email ou senha inválidos.")
        }

    } else {
        response.status(400).send("Email ou senha inválidos.")
    }
});


// Criar recado para um usuário
// Cada recado deve ser de um único usuário.
let recados= [];

app.post('/usuario/:id?', (request, response) => {
    let id= request.params

    if (id === null){
        return response.status(400).send("Identificador do usuário (id) não informado.")
    }

    const idParaRecado= usuarios.find((usuario)=>{
       return usuario.identificador === id.id
    })
    
    if (idParaRecado != undefined) {

        const recado= {
            identificador: randomUUID(),
            titulo: request.body.titulo,
            descricao: request.body.descricao,
            }
        recados.push(recado)
        idParaRecado.recados = recados

        return response.status(200).json({
            Mensagem: "Recado criado com sucesso.",
            Destinatário: idParaRecado.nome,
            Identificador: idParaRecado.identificador,
            Recado: recado,
          });
    } else {
        return response.status(400).send("Identificador do usuário inválido.")
    }
});


// Exibir recados de um usuário
app.get('/usuario/:id?', (request, response) => {
    let id= request.params

    if (id === null){
        return response.status(400).send("Identificador do usuário (id) não informado.")
    }

    const idExibirRecados= usuarios.find((usuario)=>{
       return usuario.identificador === id.id
    })
    
    if (idExibirRecados != undefined) {

        return response.status(200).json({
            Mensagem: "Lista de recados:",
            Destinatário: idExibirRecados.nome,
            Identificador: idExibirRecados.identificador,
            Recados: idExibirRecados.recados
          });
    } else {
        return response.status(400).send("Identificador do usuário inválido.")
    }
});


// Atualizar recado de um usuario
app.put('/usuario/:id/recado/:idRecado', verifyJwt, (request, response) => {
    let id= request.params;
    let idRecado= request.params;
    const user = request.user;

    if (id === null){
        return response.status(400).send("Identificador do usuário (id) não informado.")
    }

    if (idRecado === null){
        return response.status(400).send("Identificador do recado (idRecado) não informado.")
    }

    const idAtualizarRecados= usuarios.find((usuario)=>{
       return usuario.identificador === id.id
    })
    
    let recadoAtualizar=  idAtualizarRecados.recados.find((recado)=>{
        return recado.identificador === idRecado.idRecado
    })

    if (idAtualizarRecados != undefined && recadoAtualizar != undefined) {
        
        recadoAtualizar.titulo= request.body.titulo,
        recadoAtualizar.descricao= request.body.descricao     
        
        return response.status(200).json({
            Mensagem: "Recado atualizado com sucesso.",
            Destinatário: idAtualizarRecados.nome,
            Identificador: idAtualizarRecados.identificador,
            Recado: recadoAtualizar
          });
    } else {
        return response.status(400).send("Identificador do usuário e/ou recado inválido(s).")
    }

});


// Deletar recados de um usuário
app.delete('/usuario/:id/recado/:idRecado', verifyJwt, (request, response) => {

    let id= request.params;
    let idRecado= request.params;
    const user = request.user;

    if (id === null){
        return response.status(400).send("Identificador do usuário (id) não informado.")
    }

    if (idRecado === null){
        return response.status(400).send("Identificador do recado (idRecado) não informado.")
    }

    const idDeletarRecados= usuarios.find((usuario)=>{
       return usuario.identificador === id.id
    })
    
    let recadoDeletar=  idDeletarRecados.recados.findIndex((recado)=>{
        return recado.identificador === idRecado.idRecado
    })

    if (idDeletarRecados != undefined && recadoDeletar != undefined) {
        
        idDeletarRecados.recados.splice(recadoDeletar,1);
        
        return response.status(200).json({
            Mensagem: "Recado deletado com sucesso.",
          });
    } else {
        return response.status(400).send("Identificador do usuário e/ou recado inválido(s).")
    }
});


app.listen(8080, () => console.log("Servidor iniciado"));