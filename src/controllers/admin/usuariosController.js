import { Usuario } from '../../models/index.js';

export const list = async (_req,res)=>{
  const usuarios = await Usuario.findAll();
  res.render('admin/usuarios/list', { title:'Usuarios', usuarios });
};

export const formNew  = (_req,res)=>
  res.render('admin/usuarios/form', { title:'Nuevo usuario', user:{} });

export const formEdit = async (req,res)=>{
  const user = await Usuario.findByPk(req.params.id);
  if(!user) return res.redirect('/admin/usuarios');
  res.render('admin/usuarios/form', { title:`Editar ${user.nombre||user.phone}`, user, isEdit:true });
};

export const create = async (req,res)=>{
  await Usuario.create(req.body);
  res.redirect('/admin/usuarios');
};

export const update = async (req,res)=>{
  await Usuario.update(req.body,{ where:{ id:req.params.id }});
  res.redirect('/admin/usuarios');
};

export const remove = async (req,res)=>{
  await Usuario.destroy({ where:{ id:req.params.id }});
  res.redirect('/admin/usuarios');
};
