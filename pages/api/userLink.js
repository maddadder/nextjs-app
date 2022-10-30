import {connectToDatabase} from "../../util/couchbase";
import bcrypt from 'bcryptjs'
import { v4 } from 'uuid'
import { getEnv } from '../../temporal/src/util/environment';

export default async function handler(req, res) {
  const environment = getEnv()
  const {cluster, bucket, defaultCollection} = await connectToDatabase();
  // Parse the body only if it is present
  let body = !!req.body ? JSON.parse(req.body) : null;

  if (req.method === 'POST') {
    /**
     *  POST HANDLER
     */
    if (!body.Content || !body.Href) {
      return res.status(400).send({
        "message": `${!body.Content ? 'Content ' : ''}${
            (!body.Content && !body.Href)
                ? 'and Content are required' : (body.Target && !body.Href)
                ? 'Href is required' : 'is required'
        }`
      })
    }

    const id = v4();
    const userLink = {
      __T: 'ul',
      Pid: id,
      ...body
    }
    await defaultCollection.insert(userLink.Pid, userLink)
        .then((result) => {
          res.send({...userLink, ...result});
        })
        .catch((e) => {
          res.status(500).send({
            "message": `Profile Insert Failed: ${e.message}`
          })
        })
  } else if (req.method === 'PUT') {
    /**
     *  PUT HANDLER
     */
    try {
      await defaultCollection.get(req.query.Pid)
          .then(async (result) => {
            /* Create a New Document with new values,
              if they are not passed from request, use existing values */
            const newDoc = {
              __T: 'ul',
              Pid: result.content.Pid,
              Content: body.Content ? body.Content : result.content.content,
              Href: body.Href ? body.Href : result.content.href,
              Target: body.Target ? body.Target : result.content.target
            }

            /* Persist updates with new doc */
            await defaultCollection.upsert(req.query.Pid, newDoc)
                .then((result) => res.send({ ...newDoc, ...result }))
                .catch((e) => res.status(500).send(e))
          })
          .catch((e) => res.status(500).send({
            "message": `UserLInk Not Found, cannot update: ${e.message}`
          }))
    } catch (e) {
      console.error(e)
    }
  } else if (req.method === 'GET') {
    /**
     *  GET HANDLER
     */
    try {
      const options = {
        parameters: {
          SKIP: Number(req.query.skip || 0),
          LIMIT: Number(req.query.limit || 5),
          SEARCH: req.query.search ? `%${req.query.search.toLowerCase()}%` : null
        }
      }
      const query = options.parameters.SEARCH == null ? `
        SELECT p.*
        FROM ${environment.COUCHBASE_BUCKET}._default._default p
        WHERE p.__T = 'ul'
        LIMIT $LIMIT OFFSET $SKIP;
        ` : `
        SELECT p.*
        FROM ${environment.COUCHBASE_BUCKET}._default._default p
        WHERE p.__T = 'ul' AND lower(p.href) LIKE $SEARCH
        LIMIT $LIMIT OFFSET $SKIP;
      `
      await cluster.query(query, options)
          .then((result) => res.send(result.rows))
          .catch((error) => res.status(500).send({
            "message": `Query ${query} failed: ${error.message}`
          }))
    } catch (e) {
      console.error(e)
    }
  } else if (req.method === 'DELETE') {
    /**
     *  DELETE HANDLER
     */
    try {
      await defaultCollection.remove(req.query.Pid)
          .then((result) => {
            res.status(200).send("Successfully Deleted: " + req.query.Pid)
          })
          .catch((error) => res.status(500).send({
            "message": `UserLink Not Found, cannot delete: ${error.message}`
          }))
    } catch (e) {
      console.error(e)
    }
  }

}

