# LNovel

LNovel é um script node para baixar novels do site [CentralNovel](https://centralnovel.com/).

## Dependências

- [Git](https://git-scm.com/)
- [NodeJS](https://nodejs.org/en/)

## Instalação

```bash
git clone git@github.com:KeplerLeo/LNovel.git
cd LNovel
npm install
```

## Uso

```bash
npm start
```

No terminal informe o nome da novel[^1]

Selecione o capitulo inicial e final[^2]

[^1]: Informe o nome de forma correta e exata, pois é isso que será usado para salvar a novel.

[^2]: Ainda não é possível fazer downloads de capítulos secundários ou prólogos.

Após o download, uma pasta chamada Downloads será criada com o arquivo .txt dos capítulos baixados.

A criação desse script foi motivada para realizar a leitura de novels no Kindle, para isso após baixar os capítulos, utilizo o [Calibre](https://calibre-ebook.com/) para converter o arquivo .txt para .pdf e enviar para o Kindle.

Exemplo de uso do Calibre:
![Volume 8 no Calibre](https://github.com/KeplerLeo/LNovel/assets/39733399/43e0a60f-59c8-4efa-a106-e997c735aeaa)

## Futuras implementações

- [ ] Baixar capítulos de outras fontes
- [ ] Converter para .pdf com a formatação correta para o Kindle

## Contribuição

Pull requests são bem-vindos. Para grandes mudanças, abra um problema primeiro para discutir o que você gostaria de mudar.
