# BotRadar

## Workflow

我们开发以 `dev` 分支为准，`master` 分支永远为一个稳定版本。

每个人开发从 `dev` 分支 checkout 出一个自己的独立分支，然后 do something，开发完毕后push 该分支到 gitlab 上，然后发一个 Merge Request 到 dev 分支。

比如：

```
git checkout -b geekplux/feature_you_want_to_achieve
do something
git push -u origin geekplux/feature_you_want_to_achieve
```


1. git clone

```
git clone git@github.com:woaiwodib107/config.git
```

2. `cd` this dir

```
npm i
npm start
```

3. `cd` the dir *backend*

```
npm i
npm start
```

4. you can see the website on

```
http://localhost:8080/
```

5. data description of right bottom view
{
  'id' : {
    'time1': {
      'type1' : int;
      'type2' : int;
    },
    'time2': {
      'type1' : int;
      'type2' : int;
    },
    ...
    'time8': {
      'type1' : int;
      'type2' : int;
    }
  },
  'id1' : {
    'time1': {
      'type1' : int;
      'type2' : int;
    },
    'time2': {
      'type1' : int;
      'type2' : int;
    },
    ...
    'time8': {
      'type1' : int;
      'type2' : int;
    }
  },
}
